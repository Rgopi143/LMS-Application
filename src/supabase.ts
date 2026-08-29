// Client-side mock that redirects Supabase queries to Express backend and Turso.
import { User, Session } from '@supabase/supabase-js';

const authListeners = new Set<(event: string, session: any) => void>();
let currentSession: any = (() => {
  try {
    const saved = localStorage.getItem('lms_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.access_token) {
        const parts = parsed.access_token.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const jsonStr = window.atob(base64);
          const payload = JSON.parse(jsonStr);
          if (payload.exp && Date.now() > payload.exp) {
            localStorage.removeItem('lms_session');
            localStorage.removeItem('appAdminSession');
            return null;
          }
        }
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
})();

// Helper to notify all listeners
const notifyListeners = (event: string, session: any) => {
  currentSession = session;
  if (session) {
    localStorage.setItem('lms_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('lms_session');
    localStorage.removeItem('appAdminSession'); // Make sure to clean admin session too
  }
  authListeners.forEach(cb => {
    try {
      cb(event, session);
    } catch (e) {
      console.error('Error invoking auth listener:', e);
    }
  });
};

// Periodically check session via API
async function checkBackendSession() {
  try {
    const headers: HeadersInit = {};
    if (currentSession?.access_token) {
      headers['Authorization'] = `Bearer ${currentSession.access_token}`;
    }
    const res = await fetch('/api/auth/session', {
      headers
    });
    if (res.ok) {
      const data = await res.json();
      if (data.session) {
        if (!currentSession || currentSession.user.id !== data.session.user.id) {
          notifyListeners('SIGNED_IN', data.session);
        }
      } else {
        if (currentSession) {
          notifyListeners('SIGNED_OUT', null);
        }
      }
    }
  } catch (e) {
    console.debug('Failed to get session from backend', e);
  }
}

// Check session on load
setTimeout(checkBackendSession, 200);

class SupabaseQueryBuilder {
  private table: string;
  private method: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private selectColumns: string = '*';
  private bodyData: any = null;
  private filters: { field: string; op: string; value: any }[] = [];
  private orderColumn: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isExactCount: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.method = 'select';
    this.selectColumns = columns;
    if (options?.count === 'exact') {
      this.isExactCount = true;
    }
    return this;
  }

  insert(data: any) {
    this.method = 'insert';
    this.bodyData = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this.method = 'upsert';
    this.bodyData = data;
    return this;
  }

  update(data: any) {
    this.method = 'update';
    this.bodyData = data;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  not(field: string, op: string, value: any) {
    // e.g. .not('last_login', 'is', null)
    this.filters.push({ field, op: `not_${op}`, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderColumn = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // To support Promise await
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      // Include session headers if auth token exists
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      }

      const response = await fetch('/api/db-query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          table: this.table,
          method: this.method,
          selectColumns: this.selectColumns,
          bodyData: this.bodyData,
          filters: this.filters,
          orderColumn: this.orderColumn,
          orderAscending: this.orderAscending,
          limitCount: this.limitCount,
          isSingle: this.isSingle,
          isExactCount: this.isExactCount
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Database query failed');
      }

      const resData = await response.json();
      const result = {
        data: resData.data,
        error: resData.error ? { message: resData.error } : null,
        count: resData.count
      };

      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    } catch (err: any) {
      console.error('Error executing query builder:', err);
      const result = {
        data: null,
        error: { message: err.message || String(err) },
        count: null
      };
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    }
  }
}

export const supabase = {
  from(tableName: string) {
    return new SupabaseQueryBuilder(tableName);
  },

  async rpc(fnName: string, params: any) {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      }

      const response = await fetch('/api/db-rpc', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fnName, params })
      });
      const resData = await response.json();
      return {
        data: resData.data,
        error: resData.error ? { message: resData.error } : null
      };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err.message || String(err) }
      };
    }
  },

  auth: {
    async getSession() {
      // Local state is faster, will be normalized by checkBackendSession
      return { data: { session: currentSession || null } };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      // Fire immediately
      if (currentSession) {
        callback('SIGNED_IN', currentSession);
      } else {
        callback('SIGNED_OUT', null);
      }

      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            }
          }
        }
      };
    },

    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Signature check failed');
        }
        notifyListeners('SIGNED_IN', data.session);
        return { data: { session: data.session, user: data.session.user }, error: null };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: { message: err.message } };
      }
    },

    async signUp({ email, password, options }: any) {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: options?.data?.display_name || options?.data?.name || email.split('@')[0],
            role: options?.data?.role || 'student'
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Signup failed');
        }
        if (data.session) {
          notifyListeners('SIGNED_IN', data.session);
        }
        return { data: { session: data.session || null, user: data.user || null }, error: null };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: { message: err.message } };
      }
    },

    async signOut() {
      try {
        await fetch('/api/auth/signout', { method: 'POST' });
      } catch {}
      notifyListeners('SIGNED_OUT', null);
      return { error: null };
    },

    async resetPasswordForEmail(email: string, options?: any) {
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reset password request failed');
        return { data: {}, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },

    admin: {
      async createUser(userData: any) {
        try {
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (currentSession?.access_token) {
            headers['Authorization'] = `Bearer ${currentSession.access_token}`;
          }

          const res = await fetch('/api/auth/admin/create-user', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: userData.email,
              password: userData.password || Math.random().toString(36).slice(-8),
              name: userData.user_metadata?.name || userData.email.split('@')[0],
              role: userData.user_metadata?.role || 'student'
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Admin create user failed');
          return { data: { user: data.user }, error: null };
        } catch (err: any) {
          return { data: { user: null }, error: { message: err.message } };
        }
      },

      async deleteUser(id: string) {
        try {
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (currentSession?.access_token) {
            headers['Authorization'] = `Bearer ${currentSession.access_token}`;
          }

          const res = await fetch('/api/auth/admin/delete-user', {
            method: 'POST',
            headers,
            body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Admin delete user failed');
          return { error: null };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      }
    }
  }
};