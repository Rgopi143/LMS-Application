import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence, Variants } from 'motion/react';

import {

  BookOpen,

  BarChart3,

  Calendar,

  Clock,

  Users,

  Award,

  Star,

  Star as StarIcon,
  ThumbsUp,

  TrendingUp,

  Target,

  Zap,

  FileText,

  CheckCircle2,

  ExternalLink,

  PlayCircle,

  Code2,

  MessageSquare,

  Search,

  Bell,

  ChevronRight,

  Download,

  Grid,

  List,

  User,

  Settings,

  LogOut,

  Share2,

  Link,

  Mail,

  Copy,

  Eye,

  Lock,

  Shield,

  Unlock,

  Users2,

  Send,

  PieChart,

  Activity,

  TrendingDown,

  Filter,

  Plus,

  Edit,

  Trash2,

  X,

  Maximize,

  CheckCircle,

  Calendar as CalendarIcon,
  Terminal,
  Cpu,
  Coffee,
  Globe,
  Monitor,
  ArrowLeft,
  Loader2

} from 'lucide-react';

import InstallGuide from './InstallGuide';
import CourseCatalog from './CourseCatalog';
import PracticeLab from './PracticeLab';



interface Course {

  id: string;

  title: string;

  instructor: string;

  description: string;

  category: string;

  level: string;

  duration: string;

  enrolledCount: number;

  rating: number;

  thumbnail: string;

  progress?: number;

  lastAccessed?: string;

  totalLessons: number;

  completedLessons: number;

  tags: string[];

  price: string;
}



interface LMSDashboardProps {

  user: any;

  setCurrentView: (view: 'home' | 'landing' | 'lms' | 'lesson' | 'playground' | 'notes' | 'assignments' | 'references' | 'admin') => void;

  onLogout: () => void;

  completedLessons: string[];

  moduleStats: Record<string, { startTime: string | null, endTime: string | null }>;

  syllabus: any[];

  desiredTab?: string | null;

  onTabSet?: () => void;

  setCurrentCourseId?: (id: string) => void;

  isAdmin?: boolean;

}

export default function LMSDashboard({
  user,
  setCurrentView,
  onLogout,
  completedLessons = [],
  moduleStats = {},
  syllabus = [],
  desiredTab,
  onTabSet,
  setCurrentCourseId,
  isAdmin = false
}: LMSDashboardProps) {

  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'catalog' | 'progress' | 'schedule' | 'assignments' | 'playground' | 'notes' | 'rating' | 'library'>('overview');

  // Handle desiredTab prop to set active tab
  useEffect(() => {
    if (desiredTab) {
      setActiveTab(desiredTab as any);
      // Clear desiredTab after using it
      if (onTabSet) {
        onTabSet();
      }
    }
  }, [desiredTab, onTabSet]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('lmsViewMode');
    return saved ? JSON.parse(saved) : 'grid';
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('lmsSearchQuery');
    return saved ? JSON.parse(saved) : '';
  });

  // Save viewMode and searchQuery to localStorage
  useEffect(() => {
    localStorage.setItem('lmsViewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('lmsSearchQuery', JSON.stringify(searchQuery));
  }, [searchQuery]);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'assignment',
      title: 'New Assignment Posted',
      message: 'Java Spring Boot Assignment #3 is now available',
      time: '5 minutes ago',
      read: false,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'You completed your first week of learning',
      time: '1 hour ago',
      read: false,
      icon: Award,
      color: 'bg-slate-500'
    },
    {
      id: 3,
      type: 'course',
      title: 'Course Update',
      message: 'React Fundamentals has new content',
      time: '3 hours ago',
      read: true,
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      type: 'reminder',
      title: 'Study Reminder',
      message: 'Don\'t forget to continue your Java course',
      time: '1 day ago',
      read: true,
      icon: Bell,
      color: 'bg-orange-500'
    }
  ]);

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const [showProfile, setShowProfile] = useState(false);

  const [showSettings, setShowSettings] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);

  const [shareContent, setShareContent] = useState<any>(null);

  const [shareLink, setShareLink] = useState('');

  const [sharePermissions, setSharePermissions] = useState<'view' | 'edit'>('view');

  const [shareWithUsers, setShareWithUsers] = useState<string[]>([]);

  const [searchUsers, setSearchUsers] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);

  const [showRatingPrompt, setShowRatingPrompt] = useState(false);

  const [selectedRating, setSelectedRating] = useState(0);

  const [hoverRating, setHoverRating] = useState(0);

  const [lastSubmittedRating, setLastSubmittedRating] = useState<number | null>(null);
  const [selectedCourseForRating, setSelectedCourseForRating] = useState('java-fullstack-master');

  const [ratingComment, setRatingComment] = useState('');

  const [selectedNote, setSelectedNote] = useState<typeof notes[0] | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState('All');
  const [selectedLibrarySubTopic, setSelectedLibrarySubTopic] = useState('All');
  const [selectedResourceForView, setSelectedResourceForView] = useState<any>(null);

  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(isAdmin);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  // IndexedDB helpers for storing large PDF/image files
  const openIDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    const req = indexedDB.open('lmsFiles', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const saveFileToIDB = async (id: number, dataUrl: string) => {
    const db = await openIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };

  const getFileFromIDB = async (id: number): Promise<string | null> => {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  };

  const deleteFileFromIDB = async (id: number) => {
    const db = await openIDB();
    return new Promise<void>((resolve) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = () => resolve();
    });
  };

  const [uploadedResources, setUploadedResources] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('lmsUploadedResourcesMeta');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [hiddenResourceIds, setHiddenResourceIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('lmsHiddenResources');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      // Only strip the actual file data (downloadUrl with base64), keep thumbnail and other metadata
      const meta = uploadedResources.map(({ downloadUrl, ...rest }) => ({
        ...rest,
        downloadUrl: downloadUrl && downloadUrl.startsWith('idb:') ? downloadUrl : (downloadUrl && downloadUrl.startsWith('data:') ? `idb:${rest.id}` : downloadUrl)
      }));
      localStorage.setItem('lmsUploadedResourcesMeta', JSON.stringify(meta));
    } catch (e) {
      console.warn('Could not save resource metadata', e);
    }
  }, [uploadedResources]);

  useEffect(() => {
    localStorage.setItem('lmsHiddenResources', JSON.stringify(hiddenResourceIds));
  }, [hiddenResourceIds]);

  const handleDeleteResource = (resourceId: number) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      if (uploadedResources.some(r => r.id === resourceId)) {
        setUploadedResources(prev => prev.filter(r => r.id !== resourceId));
        // Also remove from IndexedDB
        deleteFileFromIDB(resourceId);
      } else {
        setHiddenResourceIds(prev => [...prev, resourceId]);
      }
    }
  };
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [driveResources, setDriveResources] = useState<any[]>([]);

  const fetchDriveFiles = async () => {
    try {
      // Fetch only Supabase Cloud files
      const res = await fetch('/api/supabase-files');
      const data = await res.json();

      setDriveResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching library resources:', error);
    }
  };

  // Fetch Drive Files
  useEffect(() => {
    fetchDriveFiles();
  }, []);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchDriveFiles();
    }
  }, [activeTab]);

  // Esc key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedResourceForView(null);
        setSelectedNote(null);
        setShowRatingPrompt(false);
        setShowExportMenu(false);
        setShowProfile(false);
        setShowSettings(false);
        setShowShareModal(false);
        setShowUploadModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedResourceForView || selectedNote || showUploadModal || showShareModal || showProfile || showSettings || showRatingPrompt) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedResourceForView, selectedNote, showUploadModal, showShareModal, showProfile, showSettings, showRatingPrompt]);

  const openFileInViewer = async (resource: any) => {
    const resolved = await resolveUrl(resource.downloadUrl);
    // Auto-match with Drive resources by title (resilient matching)
    const driveMatch = driveResources.find(dr => {
      const drTitle = dr.title.toLowerCase().replace(/\.pdf$/, '').trim();
      const resTitle = resource.title.toLowerCase().replace(/\.pdf$/, '').trim();
      return drTitle === resTitle;
    });
    setSelectedResourceForView({
      ...resource,
      downloadUrl: driveMatch ? driveMatch.downloadUrl : resolved
    });
  };

  const [editedContent, setEditedContent] = useState('');

  const [courseRatings, setCourseRatings] = useState<
    { id: string; userName: string; courseId: string; courseTitle: string; rating: number; comment: string; time: string }[]
  >([]);

  const perCourseSummary = Object.values(
    courseRatings.reduce((acc, item) => {
      if (!acc[item.courseId]) {
        acc[item.courseId] = {
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          total: 0,
          sum: 0
        };
      }
      acc[item.courseId].total += 1;
      acc[item.courseId].sum += item.rating;
      return acc;
    }, {} as Record<string, { courseId: string; courseTitle: string; total: number; sum: number }>)
  ) as { courseId: string; courseTitle: string; total: number; sum: number }[];

  const perCourseSummaryWithAverage = perCourseSummary
    .map((item) => ({
      ...item,
      average: Number((item.sum / item.total).toFixed(1))
    }))
    .sort((a, b) => b.average - a.average || b.total - a.total);
  const perCoursePieData = perCourseSummaryWithAverage.map((course) => {
    const ratingsForCourse = courseRatings.filter((item) => item.courseId === course.courseId);
    const total = ratingsForCourse.length;
    const count5 = ratingsForCourse.filter((item) => item.rating === 5).length;
    const count4 = ratingsForCourse.filter((item) => item.rating === 4).length;
    const count3 = ratingsForCourse.filter((item) => item.rating === 3).length;
    const count2 = ratingsForCourse.filter((item) => item.rating === 2).length;
    const count1 = ratingsForCourse.filter((item) => item.rating === 1).length;

    const p5 = total ? Math.round((count5 / total) * 100) : 0;
    const p4 = total ? Math.round((count4 / total) * 100) : 0;
    const p3 = total ? Math.round((count3 / total) * 100) : 0;
    const p2 = total ? Math.round((count2 / total) * 100) : 0;
    const p1 = Math.max(0, 100 - p5 - p4 - p3 - p2);

    const c1 = p5 / 5;
    const c2 = (c1 + p4) / 5;
    const c3 = (c2 + p3) / 5;
    const c4 = (c3 + p2) / 5;
    const courseInitials = course.courseTitle
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');

    const chartStyle = {
      background: `conic-gradient(
        #22d3ee 0% ${c1}%,
        #3b82f6 ${c1}% ${c2}%,
        #a855f7 ${c2}% ${c3}%,
        #ec4899 ${c3}% ${c4}%,
        #f59e0b ${c4}% 100%
      )`
    };

    return {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      total,
      p5,
      p4,
      p3,
      p2,
      p1,
      courseInitials,
      centerImage:
        course.courseId === 'java-fullstack-master'
          ? 'https://www.pngmart.com/files/23/Java-PNG-Photos.png'
          : course.courseId === 'mern-fullstack-master' || course.courseId === '2'
            ? 'data:image/jpeg;base64,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'
            : '',
      chartStyle
    };
  });



  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as any, stiffness: 100 } },
    hover: { scale: 1.05, y: -5, transition: { type: "spring" as any, stiffness: 400, damping: 10 } }
  };

  const tabVariants: Variants = {
    inactive: { scale: 1, backgroundColor: "transparent" },
    active: { scale: 1.05, backgroundColor: "rgb(51 65 85)", transition: { type: "spring" as any, stiffness: 300 } }
  };

  const dropdownVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring" as any, stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };



  // Mock users for sharing

  const portalUsers = [

    { id: 'user1', name: 'Alice Johnson', email: 'alice@lms.com', avatar: 'A', status: 'online' },

    { id: 'user2', name: 'Bob Smith', email: 'bob@lms.com', avatar: 'B', status: 'online' },

    { id: 'user3', name: 'Carol Davis', email: 'carol@lms.com', avatar: 'C', status: 'offline' },

    { id: 'user4', name: 'David Wilson', email: 'david@lms.com', avatar: 'D', status: 'online' },

    { id: 'user5', name: 'Emma Brown', email: 'emma@lms.com', avatar: 'E', status: 'away' }

  ];



  // Generate share link

  const generateShareLink = () => {

    const baseUrl = window.location.origin;

    const shareId = Math.random().toString(36).substring(7);

    const link = `${baseUrl}/shared/${shareId}`;

    setShareLink(link);

    return link;

  };



  // Copy share link

  const copyShareLink = () => {

    navigator.clipboard.writeText(shareLink);

    setCopiedLink(true);

    setTimeout(() => setCopiedLink(false), 2000);

  };



  // Share with specific users

  const shareWithUser = (userId: string) => {

    if (!shareWithUsers.includes(userId)) {

      setShareWithUsers([...shareWithUsers, userId]);

    }

  };



  // Remove user from sharing

  const removeUserFromSharing = (userId: string) => {

    setShareWithUsers(shareWithUsers.filter(id => id !== userId));

  };



  // Open share modal

  const openShareModal = (content: any, type: string) => {

    setShareContent({ ...content, type });

    generateShareLink();

    setShowShareModal(true);

  };



  // Analytics data

  const analyticsData = {

    learningProgress: [

      { month: 'Jan', progress: 65, hours: 120 },

      { month: 'Feb', progress: 72, hours: 145 },

      { month: 'Mar', progress: 78, hours: 168 },

      { month: 'Apr', progress: 82, hours: 189 },

      { month: 'May', progress: 85, hours: 201 },

      { month: 'Jun', progress: 88, hours: 224 }

    ],

    courseDistribution: [

      { category: 'Programming', value: 45, color: 'bg-blue-500' },

      { category: 'Design', value: 20, color: 'bg-purple-500' },

      { category: 'Business', value: 15, color: 'bg-slate-500' },

      { category: 'Marketing', value: 12, color: 'bg-orange-500' },

      { category: 'Data Science', value: 8, color: 'bg-red-500' }

    ],

    weeklyActivity: [

      { day: 'Mon', hours: 3.5, lessons: 2 },

      { day: 'Tue', hours: 4.2, lessons: 3 },

      { day: 'Wed', hours: 2.8, lessons: 1 },

      { day: 'Thu', hours: 5.1, lessons: 4 },

      { day: 'Fri', hours: 3.9, lessons: 2 },

      { day: 'Sat', hours: 6.2, lessons: 5 },

      { day: 'Sun', hours: 4.8, lessons: 3 }

    ],

    skillProgress: [

      { skill: 'Java', progress: 85, level: 'Advanced' },

      { skill: 'React', progress: 72, level: 'Intermediate' },

      { skill: 'Spring Boot', progress: 68, level: 'Intermediate' },

      { skill: 'MongoDB', progress: 60, level: 'Intermediate' },

      { skill: 'JavaScript', progress: 78, level: 'Advanced' }

    ],

    completionRates: [

      { course: 'Java Full Stack', completed: 78, total: 100 },

      { course: 'React Fundamentals', completed: 92, total: 100 },

      { course: 'Spring Boot', completed: 65, total: 100 },

      { course: 'MongoDB Basics', completed: 88, total: 100 }

    ]

  };






  // Mock data for demonstration

  const baseEnrolledCourses: Course[] = [

    {

      id: 'java-fullstack-master',

      title: 'Java Full Stack Development Masterclass',

      instructor: 'D. Sirisha',

      description: 'Master Java development from basics to advanced Spring Boot applications with React and MongoDB integration',

      category: 'Programming',

      level: 'Intermediate',

      duration: '16 weeks',

      enrolledCount: 1240,

      rating: 4.8,

      thumbnail: 'https://www.pngmart.com/files/23/Java-PNG-Photos.png',

      progress: 65,

      totalLessons: 45,

      completedLessons: 29,

      tags: ['Java', 'Spring Boot', 'React', 'MongoDB'],

      price: 'Free',

      lastAccessed: '2 hours ago'

    },
    {
      id: 'mern-fullstack-master',
      title: 'MERN Full Stack Development Masterclass',
      instructor: 'D. Sirisha',
      description: 'Master MERN stack development from basics to advanced React applications with Node.js, Express, and MongoDB integration',
      category: 'Programming',
      level: 'Intermediate',
      duration: '16 weeks',
      enrolledCount: 950,
      rating: 4.9,
      thumbnail: 'data:image/jpeg;base64,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',
      progress: 0,
      totalLessons: 40,
      completedLessons: 0,
      tags: ['MongoDB', 'Express', 'React', 'Node.js'],
      price: 'Free',
      lastAccessed: 'Just now'
    },
    {
      id: 'backend-development-master',
      title: 'Backend Development Masterclass',
      instructor: 'D. Sirisha',
      description: 'Master backend development using Node.js, Express, and MongoDB. Learn how to build secure REST APIs, real-time applications, and microservices.',
      category: 'Programming',
      level: 'Intermediate',
      duration: '14 weeks',
      enrolledCount: 650,
      rating: 4.8,
      thumbnail: 'https://img.icons8.com/3d-fluency/1200/backend-development.jpg',
      progress: 0,
      totalLessons: 162,
      completedLessons: 0,
      tags: ['Node.js', 'Express', 'MongoDB', 'REST API', 'Backend'],
      price: 'Free',
      lastAccessed: 'Just now'
    }
  ];

  const enrolledCourses = isAdmin ? baseEnrolledCourses : baseEnrolledCourses.filter(c => c.id !== 'backend-development-master');

  const availableCourses: Course[] = [

    {

      id: '3',

      title: 'Python for Data Science',

      instructor: 'Dr. Sarah Johnson',

      description: 'Learn Python programming with focus on data science and machine learning',

      category: 'Data Science',

      level: 'Beginner',

      duration: '12 weeks',

      enrolledCount: 2100,

      rating: 4.7,

      thumbnail: 'python-course',

      totalLessons: 40,

      completedLessons: 0,

      tags: ['Python', 'Data Science', 'ML'],

      price: '₹6,639'

    },

    {

      id: '4',

      title: 'Cloud Architecture with AWS',

      instructor: 'Mike Wilson',

      description: 'Design and deploy scalable cloud solutions using AWS services',

      category: 'Cloud Computing',

      level: 'Intermediate',

      duration: '10 weeks',

      enrolledCount: 1560,

      rating: 4.6,

      thumbnail: 'aws-course',

      totalLessons: 35,

      completedLessons: 0,

      tags: ['AWS', 'Cloud', 'DevOps'],

      price: '₹8,299'

    }

  ];



  const notes = [

    {

      id: 1,

      title: 'Java Spring Boot Configuration',

      category: 'Java',

      content: `🌱 What is Spring Boot?

Spring Boot is a framework built on top of Spring that helps you:

Create standalone applications
Avoid complex XML configurations
Run apps quickly with embedded servers (Tomcat)

⚙️ 1. Prerequisites

Before starting, you need:

Java (JDK 8 or above)
Maven or Gradle
IDE (IntelliJ / Eclipse / VS Code)

🚀 2. Creating a Spring Boot Project
Method 1: Using Spring Initializr

Steps:

Go to https://start.spring.io/
Choose:
Project: Maven
Language: Java
Spring Boot Version
Add Dependencies:
Spring Web
Click Generate

📁 3. Project Structure

Important folders:

src/main/java → Java code
src/main/resources → Config files
application.properties → Configuration file

🧠 4. Main Application Class
@SpringBootApplication
public class MyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
Explanation:
@SpringBootApplication = Combination of:
@Configuration
@EnableAutoConfiguration
@ComponentScan

🔧 5. Spring Boot Configuration
📄 application.properties
server.port=8081
spring.application.name=MyApp

📄 application.yml (alternative)
server:
  port: 8081

spring:
  application:
    name: MyApp

🔁 6. Auto Configuration Concept

Spring Boot automatically:

Configures beans
Sets up server
Connects dependencies

👉 Based on:

Classpath
Dependencies
Properties

🌐 7. Creating a Simple REST Controller
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String sayHello() {
        return "Hello Spring Boot!";
    }
}

▶️ 8. Running the Application
Using IDE:
Right-click → Run
Using terminal:
mvn spring-boot:run

🌍 9. Output

Open browser:

http://localhost:8081/hello

Output:

Hello Spring Boot!

🧩 10. Key Annotations Summary
Annotation	Purpose
@SpringBootApplication	Main config
@RestController	REST API
@GetMapping	HTTP GET
@Autowired	Dependency injection

🏁 Final Flow

Flow:
Client → Controller → Service → Repository → Database → Response

Key Points
Configure application.properties for database connections
Set up dependency injection with @Component and @Autowired
Configure server port: server.port=8080
Database URL: spring.datasource.url=jdbc:mysql://localhost:3306/dbname
Enable JPA repositories with @EnableJpaRepositories`,

      date: '2024-03-15',

      time: '2:30 PM'

    },

    {

      id: 2,

      title: 'React Hooks Best Practices',

      category: 'React',

      content: 'Key points about useState, useEffect, and custom hooks. Remember to include dependency arrays in useEffect to prevent infinite re-renders. Use useCallback for memoization.',

      date: '2024-03-14',

      time: '4:15 PM'

    },

    {

      id: 3,

      title: 'MongoDB Query Optimization',

      category: 'MongoDB',

      content: 'Notes on indexing strategies, aggregation pipelines, and query performance. Create compound indexes for frequently queried fields and use explain() to analyze query performance.',

      date: '2024-03-13',

      time: '11:45 AM'

    },

    {

      id: 4,

      title: 'REST API Design Principles',

      category: 'General',

      content: 'Best practices for designing RESTful APIs: use proper HTTP methods, implement status codes correctly, version your APIs, and follow consistent naming conventions.',

      date: '2024-03-12',

      time: '3:20 PM'

    },

    {

      id: 5,

      title: 'Spring Security Authentication',

      category: 'Spring Boot',

      content: 'JWT token implementation, password encryption with BCrypt, and role-based access control. Configure security filters and authentication endpoints properly.',

      date: '2024-03-11',

      time: '1:00 PM'

    }

  ];

  const resolveUrl = async (url: string): Promise<string> => {
    if (url && url.startsWith('idb:')) {
      const id = parseInt(url.slice(4), 10);
      const data = await getFileFromIDB(id);
      return data || '';
    }
    return url;
  };

  const handleDownload = async (url: string, filename: string) => {
    const resolved = await resolveUrl(url);
    if (!resolved) return;
    const link = document.createElement('a');
    link.href = resolved;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("category", uploadCategory);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!data.success) throw new Error("Upload failed");

      // Auto-refresh library
      await fetchDriveFiles();

      // Dynamic success notification
      const location = data.source === 'local' ? 'Locally on this server (Drive quota restricted)' : 'Google Drive';
      alert(`PDF Uploaded Successfully! Location: ${location}`);

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle("");

    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const baseLibraryResources = [
    {
      id: 22,
      title: 'Python Django',
      category: 'Python',
      subTopic: 'Web Development',
      size: '12.8 MB',
      type: 'pdf',
      downloadUrl: 'Python Django.pdf',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/python.png'
    },
    {
      id: 23,
      title: 'Python Libraries',
      category: 'Python',
      subTopic: 'Libraries',
      size: '5.2 MB',
      type: 'pdf',
      downloadUrl: 'python libraries.pdf',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/python.png'
    },
    {
      id: 24,
      title: 'Python Projects',
      category: 'Python',
      subTopic: 'Basics',
      size: '9.4 MB',
      type: 'pdf',
      downloadUrl: 'Python Projects.pdf',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/python.png'
    },
    {
      id: 25,
      title: 'Cracking the Windows Kernel',
      category: 'Cyber Security',
      subTopic: 'Ethical Hacking',
      size: '18.5 MB',
      type: 'pdf',
      downloadUrl: '/pdfs/cyber-security/Craking the Windows kernel.pdf',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/shield.png'
    },
    {
      id: 26,
      title: 'Security Engineer',
      category: 'Cyber Security',
      subTopic: 'Basics',
      size: '6.3 MB',
      type: 'pdf',
      downloadUrl: '/pdfs/cyber-security/Security Engineer.pdf',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/shield.png'
    },
    {
      id: 27,
      title: 'Course Architecture',
      category: 'Images',
      subTopic: 'Roadmaps',
      size: '450 KB',
      type: 'image',
      downloadUrl: '/images/architecture.png',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png'
    },
    {
      id: 28,
      title: 'Full Stack Java Roadmap',
      category: 'Images',
      subTopic: 'Roadmaps',
      size: '384 KB',
      type: 'image',
      downloadUrl: '/Images/roadmaps/java-roadmap.jpg',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/java.png'
    },
    {
      id: 29,
      title: 'MERN Stack Roadmap',
      category: 'Images',
      subTopic: 'Roadmaps',
      size: '360 KB',
      type: 'image',
      downloadUrl: '/Images/roadmaps/mern-roadmap.jpg',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/react-native.png'
    },
    {
      id: 30,
      title: 'Python for Everything',
      category: 'Images',
      subTopic: 'Roadmaps',
      size: '426 KB',
      type: 'image',
      downloadUrl: '/Images/roadmaps/python-roadmap.png',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/python.png'
    },
    {
      id: 31,
      title: 'Types of Neural Networks',
      category: 'Images',
      subTopic: 'Roadmaps',
      size: '321 KB',
      type: 'image',
      downloadUrl: '/Images/roadmaps/neural-networks.png',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/brain.png'
    },
    {
      id: 32,
      title: '.NET Full-Stack Reality',
      category: 'Images',
      subTopic: 'Roadmaps',
      size: '501 KB',
      type: 'image',
      downloadUrl: '/Images/roadmaps/dotnet-humor.png',
      thumbnail: 'https://img.icons8.com/3d-fluency/188/bug.png'
    },
    { id: 201, title: 'Internet Basics', category: 'Images', subTopic: 'Data Images', size: '145.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Internet-Basics.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 202, title: 'World Wide Web (WWW)', category: 'Images', subTopic: 'Data Images', size: '27.1 KB', type: 'image', downloadUrl: 'Images/DATA Images/World-Wide-Web-WWW.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 203, title: 'Web Browsers and Rendering', category: 'Images', subTopic: 'Data Images', size: '55.1 KB', type: 'image', downloadUrl: 'Images/DATA Images/Web-Browsers-and-Rendering.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 204, title: 'Client–Server Architecture', category: 'Images', subTopic: 'Data Images', size: '103.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/ClientServer-Architecture.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 205, title: 'Frontend vs Backend', category: 'Images', subTopic: 'Data Images', size: '93.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Frontend-vs-Backend.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 206, title: 'Full Stack Development', category: 'Images', subTopic: 'Data Images', size: '101.8 KB', type: 'image', downloadUrl: 'Images/DATA Images/Full-Stack-Development.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 207, title: 'Static vs Dynamic Websites', category: 'Images', subTopic: 'Data Images', size: '92.8 KB', type: 'image', downloadUrl: 'Images/DATA Images/Static-vs-Dynamic-Websites.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 208, title: 'Development Tools', category: 'Images', subTopic: 'Data Images', size: '91.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Development-Tools.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 209, title: 'VS Code Setup', category: 'Images', subTopic: 'Data Images', size: '91.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/VS-Code-Setup.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 210, title: 'Browser Developer Tools', category: 'Images', subTopic: 'Data Images', size: '89.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Browser-Developer-Tools.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 211, title: 'HTML Overview', category: 'Images', subTopic: 'Data Images', size: '90.1 KB', type: 'image', downloadUrl: 'Images/DATA Images/HTML-Overview.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 212, title: 'History of HTML', category: 'Images', subTopic: 'Data Images', size: '102 KB', type: 'image', downloadUrl: 'Images/DATA Images/History-of-HTML.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 213, title: 'Features of HTML', category: 'Images', subTopic: 'Data Images', size: '84.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Features-of-HTML.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 214, title: 'HTML Versions', category: 'Images', subTopic: 'Data Images', size: '75.8 KB', type: 'image', downloadUrl: 'Images/DATA Images/HTML-Versions.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 215, title: 'HTML Page Structure', category: 'Images', subTopic: 'Data Images', size: '99.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/HTML-Page-Structure.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 216, title: 'HTML Syntax', category: 'Images', subTopic: 'Data Images', size: '74.8 KB', type: 'image', downloadUrl: 'Images/DATA Images/HTML-Syntax.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 217, title: 'HTML Comments', category: 'Images', subTopic: 'Data Images', size: '97.4 KB', type: 'image', downloadUrl: 'Images/DATA Images/HTML-Comments.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 218, title: 'Heading Tags', category: 'Images', subTopic: 'Data Images', size: '97.5 KB', type: 'image', downloadUrl: 'Images/DATA Images/Heading-Tags.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 219, title: 'Paragraph Tag', category: 'Images', subTopic: 'Data Images', size: '95.5 KB', type: 'image', downloadUrl: 'Images/DATA Images/Paragraph-Tag.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 220, title: 'Line Break', category: 'Images', subTopic: 'Data Images', size: '89.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Line-Break.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 221, title: 'Horizontal Rule', category: 'Images', subTopic: 'Data Images', size: '89.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/Horizontal-Rule.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 222, title: 'Text Formatting Tags', category: 'Images', subTopic: 'Data Images', size: '81.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Text-Formatting-Tags.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 223, title: 'Anchor Tag', category: 'Images', subTopic: 'Data Images', size: '75 KB', type: 'image', downloadUrl: 'Images/DATA Images/Anchor-Tag.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 224, title: 'Internal Links', category: 'Images', subTopic: 'Data Images', size: '81.7 KB', type: 'image', downloadUrl: 'Images/DATA Images/Internal-Links.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 225, title: 'External Links', category: 'Images', subTopic: 'Data Images', size: '94.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/External-Links.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 226, title: 'Email Links', category: 'Images', subTopic: 'Data Images', size: '121.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Email-Links.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 227, title: 'Bookmark Links', category: 'Images', subTopic: 'Data Images', size: '82 KB', type: 'image', downloadUrl: 'Images/DATA Images/Bookmark-Links.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 228, title: 'Image Tag', category: 'Images', subTopic: 'Data Images', size: '93.5 KB', type: 'image', downloadUrl: 'Images/DATA Images/Image-Tag.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 229, title: 'Audio Tag', category: 'Images', subTopic: 'Data Images', size: '55.7 KB', type: 'image', downloadUrl: 'Images/DATA Images/Audio-Tag.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 230, title: 'Video Tag', category: 'Images', subTopic: 'Data Images', size: '131.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Video-Tag.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 231, title: 'Iframe', category: 'Images', subTopic: 'Data Images', size: '102.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/Iframe.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 232, title: 'Ordered Lists', category: 'Images', subTopic: 'Data Images', size: '55.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/Ordered-Lists.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 233, title: 'Unordered Lists', category: 'Images', subTopic: 'Data Images', size: '87.7 KB', type: 'image', downloadUrl: 'Images/DATA Images/Unordered-Lists.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 234, title: 'Description Lists', category: 'Images', subTopic: 'Data Images', size: '54.6 KB', type: 'image', downloadUrl: 'Images/DATA Images/Description-Lists.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 235, title: 'Nested Lists', category: 'Images', subTopic: 'Data Images', size: '89.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Nested-Lists.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 236, title: 'Table Structure', category: 'Images', subTopic: 'Data Images', size: '88 KB', type: 'image', downloadUrl: 'Images/DATA Images/Table-Structure.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 237, title: 'Table Headers', category: 'Images', subTopic: 'Data Images', size: '82.8 KB', type: 'image', downloadUrl: 'Images/DATA Images/Table-Headers.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 238, title: 'Rowspan and Colspan', category: 'Images', subTopic: 'Data Images', size: '83.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Rowspan-and-Colspan.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 239, title: 'Form Tag', category: 'Images', subTopic: 'Data Images', size: '119.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Form-Tag.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 240, title: 'Input Types', category: 'Images', subTopic: 'Data Images', size: '105.6 KB', type: 'image', downloadUrl: 'Images/DATA Images/Input-Types.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 241, title: 'Textarea', category: 'Images', subTopic: 'Data Images', size: '53.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/Textarea.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 242, title: 'Dropdown', category: 'Images', subTopic: 'Data Images', size: '78.2 KB', type: 'image', downloadUrl: 'Images/DATA Images/Dropdown.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 243, title: 'Buttons', category: 'Images', subTopic: 'Data Images', size: '100.7 KB', type: 'image', downloadUrl: 'Images/DATA Images/Buttons.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 244, title: 'Header', category: 'Images', subTopic: 'Data Images', size: '103.1 KB', type: 'image', downloadUrl: 'Images/DATA Images/Header.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 245, title: 'Footer', category: 'Images', subTopic: 'Data Images', size: '36.4 KB', type: 'image', downloadUrl: 'Images/DATA Images/Footer.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 246, title: 'Section', category: 'Images', subTopic: 'Data Images', size: '130 KB', type: 'image', downloadUrl: 'Images/DATA Images/Section.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 247, title: 'Article', category: 'Images', subTopic: 'Data Images', size: '72.5 KB', type: 'image', downloadUrl: 'Images/DATA Images/Article.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 248, title: 'Nav', category: 'Images', subTopic: 'Data Images', size: '19.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/Nav.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 249, title: 'Main', category: 'Images', subTopic: 'Data Images', size: '97.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Main.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 250, title: 'Figure', category: 'Images', subTopic: 'Data Images', size: '90.8 KB', type: 'image', downloadUrl: 'Images/DATA Images/Figure.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 251, title: 'Figcaption', category: 'Images', subTopic: 'Data Images', size: '89.5 KB', type: 'image', downloadUrl: 'Images/DATA Images/Figcaption.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 252, title: 'CSS Overview', category: 'Images', subTopic: 'Data Images', size: '97.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/CSS-Overview.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 253, title: 'CSS Syntax', category: 'Images', subTopic: 'Data Images', size: '98.6 KB', type: 'image', downloadUrl: 'Images/DATA Images/CSS-Syntax.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 254, title: 'Inline CSS', category: 'Images', subTopic: 'Data Images', size: '96.1 KB', type: 'image', downloadUrl: 'Images/DATA Images/Inline-CSS.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 255, title: 'Internal CSS', category: 'Images', subTopic: 'Data Images', size: '100.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/Internal-CSS.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 256, title: 'External CSS', category: 'Images', subTopic: 'Data Images', size: '44.9 KB', type: 'image', downloadUrl: 'Images/DATA Images/External-CSS.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 257, title: 'Element Selector', category: 'Images', subTopic: 'Data Images', size: '71.4 KB', type: 'image', downloadUrl: 'Images/DATA Images/Element-Selector.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 258, title: 'Class Selector', category: 'Images', subTopic: 'Data Images', size: '76.6 KB', type: 'image', downloadUrl: 'Images/DATA Images/Class-Selector.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 259, title: 'ID Selector', category: 'Images', subTopic: 'Data Images', size: '47.3 KB', type: 'image', downloadUrl: 'Images/DATA Images/ID-Selector.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' },
    { id: 260, title: 'Universal Selector', category: 'Images', subTopic: 'Data Images', size: '49.4 KB', type: 'image', downloadUrl: 'Images/DATA Images/Universal-Selector.jpeg', thumbnail: 'https://img.icons8.com/3d-fluency/188/picture.png' }
  ];

  const libraryResources = [...baseLibraryResources, ...driveResources].reduce((acc, resource) => {
    const normalize = (t: string) => t.toLowerCase().replace(/\.pdf$/, "").replace(/\(\d+\)$/, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    const resTitle = normalize(resource.title);
    const existingIndex = acc.findIndex((r: any) => normalize(r.title) === resTitle);

    if (existingIndex !== -1) {
      const fromDrive = (resource as any).source === 'drive';
      const existing = acc[existingIndex];

      acc[existingIndex] = {
        ...existing,
        ...resource,
        downloadUrl: fromDrive ? (resource as any).downloadUrl : (existing.source === 'drive' ? (existing as any).downloadUrl : existing.downloadUrl),
        source: fromDrive || existing.source === 'drive' ? 'drive' : 'local'
      };
      return acc;
    }

    acc.push(resource);
    return acc;
  }, [] as any[]).filter(resource => {
    if (isAdmin) return true;

    const isImageOrPdf = resource.category === 'Images' || resource.type === 'pdf' || resource.type === 'image';
    const isExcluded = ['Python', 'Cyber Security'].includes(resource.category);

    return isImageOrPdf && !isExcluded;
  });

  const stats = {

    totalCourses: enrolledCourses.length + availableCourses.length,

    completedCourses: 1,

    totalHours: 156,

    certificates: 2,

    avgProgress: 47.5,

    weeklyHours: 12

  };



  const upcomingEvents = [

    { id: 1, title: 'Java Live Session', date: 'Today', time: '3:00 PM', type: 'live' },

    { id: 2, title: 'React Assignment Due', date: 'Tomorrow', time: '11:59 PM', type: 'assignment' },

    { id: 3, title: 'Python Quiz', date: 'Dec 28', time: '2:00 PM', type: 'quiz' }

  ];



  // Filter notes based on selected category

  const filteredNotes = selectedCategory === 'All'

    ? notes

    : notes.filter(note => note.category === selectedCategory);



  const achievements = [

    { id: 1, title: 'Fast Learner', description: 'Complete 5 lessons in one day', icon: Zap, unlocked: true },

    { id: 2, title: 'Dedicated Student', description: '7-day streak', icon: Target, unlocked: true },

    { id: 3, title: 'Course Master', description: 'Complete first course', icon: Award, unlocked: false }

  ];



  const CourseCard: React.FC<{ course: Course; isEnrolled?: boolean }> = ({ course, isEnrolled = false }) => (

    <motion.div

      variants={cardVariants}

      initial="hidden"

      animate="visible"

      whileHover="hover"

      onHoverStart={() => setHoveredCard(course.id)}

      onHoverEnd={() => setHoveredCard(null)}

      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative group"

    >

      {/* Animated gradient overlay */}

      <motion.div

        className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"

        initial={{ opacity: 0 }}

        whileHover={{ opacity: 1 }}

      />



      <div className={`relative h-48 flex items-center justify-center overflow-hidden ${course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:') ? 'bg-white' : 'bg-gradient-to-br from-slate-400 to-teal-600'}`}>

        {/* Animated background pattern */}

        <motion.div

          className="absolute inset-0"

          initial={{ scale: 1, rotate: 0 }}

          whileHover={{ scale: 1.1, rotate: course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:') ? 0 : 5 }}

          transition={{ duration: 0.5, type: "spring" }}

        >

          <div className={`absolute inset-0 ${course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:') ? 'bg-transparent' : 'bg-white/10 backdrop-blur-sm'}`}></div>

        </motion.div>



        <motion.div

          animate={{

            rotate: hoveredCard === course.id && !(course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) ? 360 : 0,

            scale: hoveredCard === course.id ? 1.1 : 1

          }}

          transition={{ duration: 0.5, type: "spring" }}

        >

          {course.thumbnail.startsWith('data:') ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : course.thumbnail.startsWith('http') ? (
            <img src={course.thumbnail} alt={course.title} className="w-24 h-24 object-contain drop-shadow-md" />
          ) : (
            <BookOpen className="text-white drop-shadow-md" size={48} />
          )}

        </motion.div>



        {/* Floating particles */}

        {hoveredCard === course.id && (

          <motion.div

            className="absolute inset-0 pointer-events-none"

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

          >

            {[...Array(6)].map((_, i) => (

              <motion.div

                key={i}

                className="absolute w-2 h-2 bg-white/30 rounded-full"

                initial={{

                  x: Math.random() * 100 + "%",

                  y: Math.random() * 100 + "%",

                  scale: 0

                }}

                animate={{

                  x: Math.random() * 100 + "%",

                  y: Math.random() * 100 + "%",

                  scale: [0, 1, 0]

                }}

                transition={{

                  duration: 2 + Math.random() * 2,

                  repeat: Infinity,

                  delay: Math.random() * 2

                }}

              />

            ))}

          </motion.div>

        )}

      </div>



      <div className="relative p-6">

        <motion.div

          className="flex items-center justify-between mb-2"

          initial={{ opacity: 0, x: -20 }}

          animate={{ opacity: 1, x: 0 }}

          transition={{ delay: 0.1 }}

        >

          <motion.span

            className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200"

            whileHover={{ scale: 1.1, backgroundColor: "rgb(51 65 85 / 0.1)" }}

            transition={{ type: "spring" }}

          >

            {course.category}

          </motion.span>

          <motion.div

            className="flex items-center gap-1"

            whileHover={{ scale: 1.1 }}

            transition={{ type: "spring" }}

          >

            <motion.div

              animate={{ rotate: hoveredCard === course.id ? 360 : 0 }}

              transition={{ duration: 0.5 }}

            >

              <Star className="text-yellow-500 fill-yellow-500" size={14} />

            </motion.div>

            <span className="text-sm font-semibold">{course.rating}</span>

          </motion.div>

        </motion.div>



        <motion.h3

          className="text-lg font-bold text-slate-900 mb-2"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.2 }}

        >

          {course.title}

        </motion.h3>



        <motion.p

          className="text-sm text-slate-600 mb-4 line-clamp-2"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.3 }}

        >

          {course.description}

        </motion.p>



        <motion.div

          className="flex items-center justify-between mb-4"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.4 }}

        >

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <Clock size={14} />

            <span>{course.duration}</span>

          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <Users size={14} />

            <span>{course.enrolledCount.toLocaleString()}</span>

          </div>

        </motion.div>



        {isEnrolled && course.progress !== undefined && (

          <motion.div

            className="mb-4"

            initial={{ opacity: 0, scaleX: 0 }}

            animate={{ opacity: 1, scaleX: 1 }}

            transition={{ delay: 0.5 }}

          >

            <div className="flex items-center justify-between text-sm mb-2">

              <span className="text-slate-600 font-bold">Progress</span>

              <span className="text-slate-600 font-bold">{course.progress}%</span>

            </div>

            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">

              <motion.div

                className="bg-gradient-to-r from-slate-500 to-teal-600 h-full rounded-full relative"

                initial={{ width: 0 }}

                animate={{ width: `${course.progress}%` }}

                transition={{ duration: 1, type: "spring", stiffness: 50 }}

              >

                <motion.div

                  className="absolute inset-0 bg-white/30 animate-pulse"

                  initial={{ x: "-100%" }}

                  animate={{ x: "100%" }}

                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}

                />

              </motion.div>

            </div>

          </motion.div>

        )}



        <motion.div

          className="flex items-center justify-between"

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.6 }}

        >

          <div className="flex items-center gap-2">

            <span className="text-2xl font-bold text-slate-900">{course.price}</span>

            {!isEnrolled && (

              <motion.span
                className="text-xs text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}

              >

                ₹{parseInt(course.price.replace('₹', '').replace(',', '')) * 1.5}

              </motion.span>

            )}

          </div>

          <div className="flex items-center gap-2">

            <motion.button

              whileHover={{ scale: 1.05 }}

              whileTap={{ scale: 0.95 }}

              onClick={() => openShareModal(course, 'course')}

              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"

              title="Share course"

            >

              <Share2 size={16} />

            </motion.button>

            <motion.button

              whileHover={{ scale: 1.05 }}

              whileTap={{ scale: 0.95 }}

              onClick={() => {
                if (setCurrentCourseId) setCurrentCourseId(course.id);
                setCurrentView('lesson');
              }}

              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${isEnrolled

                ? 'bg-slate-600 text-white hover:bg-slate-700 shadow-lg hover:shadow-slate-600/50'

                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-slate-900/50'

                }`}

            >

              {isEnrolled ? 'Continue' : 'Enroll'}

            </motion.button>

          </div>

        </motion.div>



        {isEnrolled && course.lastAccessed && (

          <div className="text-xs text-slate-500 mt-3">

            Last accessed: {course.lastAccessed}

          </div>

        )}

      </div>

    </motion.div>

  );


  const getViewerUrl = (url: string) => {
    if (!url) return '';

    // Direct load for Supabase or local files
    if (url.includes('supabase.co') || url.startsWith('/')) {
      return url;
    }

    // If it's already a full Google Drive link, extract the ID and use the viewer format
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
      if (fileIdMatch) {
        return `https://docs.google.com/viewer?srcid=${fileIdMatch[1]}&pid=explorer&efh=false&a=v&rel=0&hl=en_US&embedded=true`;
      }
      return url;
    }

    if (url.startsWith('http')) return url;

    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const parts = cleanUrl.split('/');
    const potentialId = parts[0];

    // If it looks like a standalone Drive ID
    if (potentialId.length > 20 && parts.length === 1) {
      return `https://docs.google.com/viewer?srcid=${potentialId}&pid=explorer&efh=false&a=v&rel=0&hl=en_US&embedded=true`;
    }

    return url.startsWith('/') ? url : `/${url}`;
  };

  return (

    <div className="min-h-screen bg-slate-50 overflow-hidden">

      {/* Header */}

      <header className="bg-white border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-6 py-4">

          <div className="flex items-center justify-between gap-4">

            <div className="w-48 shrink-0">

              <h1 className="text-2xl font-bold text-slate-900">LMS Portal</h1>

            </div>

            <div className="flex-1 flex justify-center">

              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-full max-w-md">

                <Search size={18} className="text-slate-400" />

                <input

                  type="text"

                  placeholder="Search courses..."

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  className="bg-transparent outline-none text-sm w-full"

                />

              </div>

            </div>

            <div className="flex items-center gap-4 w-48 shrink-0 justify-end">

              {/* Notifications Button */}

              <div className="relative">

                <motion.button

                  whileHover={{ scale: 1.1 }}

                  whileTap={{ scale: 0.95 }}

                  onClick={() => {
                    if (!showNotifications && notifications.length > 0) {
                      clearNotifications();
                    } else {
                      setShowNotifications(!showNotifications);
                    }
                    setShowProfile(false);

                    setShowSettings(false);

                  }}

                  className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors"

                >

                  <motion.div

                    animate={{ rotate: showNotifications ? 15 : 0 }}

                    transition={{ type: "spring", stiffness: 300 }}

                  >

                    <Bell size={20} className="text-slate-600" />

                  </motion.div>

                  {notifications.filter(n => !n.read).length > 0 && (

                    <motion.div

                      className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"

                      animate={{ scale: [1, 1.2, 1] }}

                      transition={{ duration: 2, repeat: Infinity }}

                    />

                  )}

                </motion.button>



                {/* Notifications Dropdown */}

                {showNotifications && (

                  <motion.div

                    variants={dropdownVariants}

                    initial="hidden"

                    animate="visible"

                    exit="exit"

                    className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"

                  >

                    <div className="p-4 border-b border-slate-200">

                      <div className="flex items-center justify-between">

                        <h3 className="font-semibold text-slate-900">Notifications</h3>

                        <motion.button

                          whileHover={{ scale: 1.05 }}

                          whileTap={{ scale: 0.95 }}

                          onClick={clearNotifications}

                          className="text-xs text-slate-600 hover:text-slate-700 font-medium"

                        >

                          Clear all notifications

                        </motion.button>

                      </div>

                    </div>



                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (

                          <motion.div

                            key={notification.id}

                            initial={{ opacity: 0, x: -20 }}

                            animate={{ opacity: 1, x: 0 }}

                            transition={{ delay: index * 0.1 }}

                            className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50' : ''

                              }`}

                          >

                            <div className="flex items-start gap-3">

                              <motion.div

                                className={`w-10 h-10 ${notification.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}

                                whileHover={{ scale: 1.1, rotate: 5 }}

                                transition={{ type: "spring" }}

                              >

                                <notification.icon size={18} />

                              </motion.div>

                              <div className="flex-1 min-w-0">

                                <div className="flex items-center justify-between mb-1">

                                  <h4 className="font-medium text-slate-900 text-sm">{notification.title}</h4>

                                  {!notification.read && (

                                    <motion.div

                                      className="w-2 h-2 bg-blue-500 rounded-full"

                                      animate={{ scale: [1, 1.5, 1] }}

                                      transition={{ duration: 2, repeat: Infinity }}

                                    />

                                  )}

                                </div>

                                <p className="text-xs text-slate-600 mb-1">{notification.message}</p>

                                <p className="text-xs text-slate-400">{notification.time}</p>

                              </div>

                            </div>

                          </motion.div>

                        ))) :
                        (
                          <div className="text-center py-12">
                            <Bell size={32} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                          </div>
                        )}
                    </div>



                    <div className="p-3 border-t border-slate-200">

                      <motion.button

                        whileHover={{ scale: 1.02 }}

                        whileTap={{ scale: 0.98 }}

                        className="w-full text-center text-sm text-slate-600 hover:text-slate-700 font-medium"

                      >

                        View all notifications

                      </motion.button>

                    </div>

                  </motion.div>

                )}

              </div>



              {/* Profile Section */}

              <div className="relative">

                <motion.button

                  whileHover={{ scale: 1.05 }}

                  whileTap={{ scale: 0.95 }}

                  onClick={() => {

                    setShowProfile(!showProfile);

                    setShowNotifications(false);

                    setShowSettings(false);

                  }}

                  className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 transition-colors"

                >

                  <motion.div

                    className="w-10 h-10 bg-gradient-to-br from-slate-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg"

                    whileHover={{ scale: 1.1, rotate: 5 }}

                    transition={{ type: "spring" }}

                  >

                    {user?.email?.[0]?.toUpperCase() || 'U'}

                  </motion.div>

                  <div className="text-left">

                    <div className="text-sm font-semibold text-slate-900">

                      {user?.user_metadata?.display_name || 'Student'}

                    </div>

                    <div className="text-xs text-slate-500">Premium Member</div>

                  </div>

                </motion.button>



                {/* Profile Dropdown */}

                <AnimatePresence>
                  {showProfile && (
                    <>
                      {/* Global Backdrop for outside click closure */}
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setShowProfile(false)}
                      />

                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                      >
                        <div className="p-6 border-b border-slate-200 relative">
                          <button
                            onClick={() => setShowProfile(false)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Close"
                          >
                            <X size={16} />
                          </button>
                          <div className="flex items-center gap-4">

                            <motion.div
                              className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"

                              whileHover={{ scale: 1.1, rotate: 10 }}

                              transition={{ type: "spring" }}

                            >

                              {user?.email?.[0]?.toUpperCase() || 'U'}

                            </motion.div>

                            <div>

                              <h3 className="font-semibold text-slate-900">

                                {user?.user_metadata?.display_name || 'Student'}

                              </h3>

                              <p className="text-sm text-slate-500">{user?.email || 'student@example.com'}</p>

                              <div className="flex items-center gap-1 mt-1">

                                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>

                                <span className="text-xs text-slate-600 font-medium">Premium Member</span>

                              </div>

                            </div>

                          </div>

                        </div>



                        <div className="p-2">
                          {isAdmin && (
                            <motion.button
                              whileHover={{ scale: 1.02, x: 5, backgroundColor: 'rgba(51, 65, 85, 0.05)' }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCurrentView('admin')}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group mb-1 border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
                                  <Shield size={16} />
                                </div>
                                <span className="text-sm font-bold text-slate-800">Admin Panel</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </motion.button>
                          )}

                          {[

                            { icon: User, label: 'Edit Profile', value: '' },

                            { icon: BookOpen, label: 'Courses', value: '3 Active' },

                            { icon: Award, label: 'Achievements', value: '12 Earned' },

                            { icon: Clock, label: 'Learning Time', value: '24h Total' },

                            { icon: Settings, label: 'Account Settings', value: '' }

                          ].map((item, index) => (

                            <motion.button

                              key={item.label}

                              initial={{ opacity: 0, x: -20 }}

                              animate={{ opacity: 1, x: 0 }}

                              transition={{ delay: index * 0.1 }}

                              whileHover={{ scale: 1.02, x: 5 }}

                              whileTap={{ scale: 0.98 }}

                              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"

                            >

                              <div className="flex items-center gap-3">

                                <motion.div

                                  whileHover={{ scale: 1.2, rotate: 10 }}

                                  transition={{ type: "spring" }}

                                >

                                  <item.icon size={18} className="text-slate-600" />

                                </motion.div>

                                <span className="text-sm text-slate-700">{item.label}</span>

                              </div>

                              {item.value && (

                                <span className="text-xs text-white font-bold">{item.value}</span>

                              )}

                            </motion.button>

                          ))}

                        </div>



                        <div className="p-3 border-t border-slate-200">

                          <motion.button

                            whileHover={{ scale: 1.02 }}

                            whileTap={{ scale: 0.98 }}

                            onClick={onLogout}

                            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"

                          >

                            <LogOut size={18} />

                            <span className="font-medium">Sign Out</span>

                          </motion.button>

                        </div>

                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

              </div>

            </div>

          </div>

        </div>

      </header>



      {/* Navigation Tabs */}

      <div className="bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth">

            {[

              { id: 'overview', label: 'Overview', icon: Grid },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'catalog', label: 'Catalog', icon: BookOpen },
              { id: 'progress', label: 'Progress', icon: BarChart3 },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'playground', label: 'Playground', icon: Code2 },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'rating', label: 'Rating', icon: StarIcon },
              { id: 'library', label: 'Library', icon: BookOpen }

            ].filter(tab => isAdmin || (tab.id !== 'rating')).map((tab, index) => (

              <motion.div

                key={tab.id}

                initial={{ opacity: 0, y: -20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}

              >

                <motion.button
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-1.5 py-3 px-1.5 transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >

                  <motion.div

                    animate={{

                      rotate: activeTab === tab.id ? 360 : 0,

                      scale: activeTab === tab.id ? 1.2 : 1

                    }}

                    transition={{ duration: 0.3, type: "spring" }}

                  >

                    <tab.icon size={16} />

                  </motion.div>

                  <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">{tab.label}</span>

                </motion.button>

              </motion.div>

            ))}

          </div>

        </div>

      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Schedule Tab */}

        {activeTab === 'schedule' && (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="space-y-8"

          >

            <h2 className="text-xl font-bold text-slate-900">Learning Schedule</h2>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Half - Minimized Calendar */}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-base font-semibold text-slate-900">Calendar</h3>

                  <div className="flex items-center gap-2">

                    <motion.button

                      whileHover={{ scale: 1.05 }}

                      whileTap={{ scale: 0.95 }}

                      className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"

                    >

                      <ChevronRight size={14} className="rotate-180" />

                    </motion.button>

                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">

                      March 2026

                    </span>

                    <motion.button

                      whileHover={{ scale: 1.05 }}

                      whileTap={{ scale: 0.95 }}

                      className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"

                    >

                      <ChevronRight size={14} />

                    </motion.button>

                  </div>

                </div>



                {/* Compact Calendar */}

                <div className="grid grid-cols-7 gap-1 text-xs">

                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (

                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">

                      {day}

                    </div>

                  ))}

                  {Array.from({ length: 35 }, (_, i) => {

                    const dayNum = i - 2; // March starts on Wednesday

                    const isCurrentMonth = dayNum >= 1 && dayNum <= 31;

                    const isToday = dayNum === 24;

                    const hasEvent = [5, 8, 12, 15, 19, 22, 24, 26, 29].includes(dayNum);



                    return (

                      <motion.div

                        key={i}

                        whileHover={{ scale: 1.1 }}

                        className={`aspect-square flex flex-col items-center justify-center rounded cursor-pointer text-xs shadow-sm hover:shadow-md transition-shadow ${isToday

                          ? 'bg-slate-600 text-white font-bold shadow-slate-200'

                          : isCurrentMonth

                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 shadow-slate-200'

                            : 'text-slate-300'

                          }`}

                      >

                        {isCurrentMonth ? dayNum : ''}

                        {hasEvent && isCurrentMonth && (

                          <div className={`w-0.5 h-0.5 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-slate-500'}`} />

                        )}

                      </motion.div>

                    );

                  })}

                </div>

              </div>



              <motion.div

                whileHover={{ scale: 1.02 }}

                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"

              >

                <h3 className="text-lg font-semibold text-slate-900 mb-4">Study Goals</h3>

                <div className="space-y-4">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">

                        <CheckCircle2 size={16} className="text-slate-600" />

                      </div>

                      <span className="text-sm text-slate-700">Complete 5 lessons</span>

                    </div>

                    <span className="text-xs font-medium text-slate-600">3/5</span>

                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2">

                    <div className="bg-slate-500 h-2 rounded-full" style={{ width: '60%' }}></div>

                  </div>



                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">

                        <Clock size={16} className="text-blue-600" />

                      </div>

                      <span className="text-sm text-slate-700">Study 10 hours</span>

                    </div>

                    <span className="text-xs font-medium text-blue-600">7.5/10</span>

                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2">

                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>

                  </div>

                </div>

              </motion.div>

            </div>

          </motion.div>

        )}



        {/* Overview Tab */}

        {activeTab === 'overview' && (

          <motion.div

            variants={containerVariants}

            initial="hidden"

            animate="visible"

            className="space-y-8"

          >

            <motion.h2

              className="text-xl font-bold text-slate-900"

              initial={{ opacity: 0, x: -20 }}

              animate={{ opacity: 1, x: 0 }}

              transition={{ duration: 0.5 }}

            >

              Dashboard Overview

            </motion.h2>



            {/* Stats Cards */}

            <motion.div

              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

              variants={containerVariants}

            >

              {[

                { id: 'courses', title: 'Enrolled Courses', value: '3', change: '+1 this month', icon: BookOpen, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },

                { id: 'progress', title: 'Completion Rate', value: '78%', change: '+12% vs last month', icon: TrendingUp, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },

                { id: 'time', title: 'Learning Time', value: '24h', change: '+3h this week', icon: Clock, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },

                { id: 'achievements', title: 'Achievements', value: '12', change: '+2 this week', icon: Award, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' }

              ].map((stat, index) => (

                <motion.div

                  key={stat.id}

                  variants={cardVariants}

                  whileHover={{

                    scale: 1.05,

                    y: -8,

                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"

                  }}

                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative group"

                >

                  {/* Animated gradient background */}

                  <motion.div

                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}

                  />



                  <div className="relative p-6">

                    <motion.div

                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} mb-4`}

                      whileHover={{

                        scale: 1.1,

                        rotate: 360,

                        transition: { duration: 0.6 }

                      }}

                    >

                      <stat.icon className={stat.textColor} size={24} />

                    </motion.div>



                    <motion.h3

                      className="text-2xl font-bold text-slate-900 mb-1"

                      initial={{ opacity: 0, y: 10 }}

                      animate={{ opacity: 1, y: 0 }}

                      transition={{ delay: index * 0.1 + 0.2 }}

                    >

                      {stat.value}

                    </motion.h3>



                    <motion.p

                      className="text-sm text-slate-600 mb-2"

                      initial={{ opacity: 0, y: 10 }}

                      animate={{ opacity: 1, y: 0 }}

                      transition={{ delay: index * 0.1 + 0.3 }}

                    >

                      {stat.title}

                    </motion.p>



                    <motion.div

                      className={`text-xs font-medium ${stat.textColor} flex items-center gap-1`}

                      initial={{ opacity: 0, x: -10 }}

                      animate={{ opacity: 1, x: 0 }}

                      transition={{ delay: index * 0.1 + 0.4 }}

                    >

                      <motion.div

                        animate={{ scale: [1, 1.2, 1] }}

                        transition={{ duration: 2, repeat: Infinity }}

                      >

                        {stat.change.startsWith('+') ? '📈' : '📊'}

                      </motion.div>

                      {stat.change}

                    </motion.div>



                    {/* Floating particles */}

                    <motion.div

                      className="absolute inset-0 pointer-events-none"

                      initial={{ opacity: 0 }}

                      whileHover={{ opacity: 1 }}

                    >

                      {[...Array(3)].map((_, i) => (

                        <motion.div

                          key={i}

                          className={`absolute w-1 h-1 ${stat.textColor.replace('text', 'bg').replace('600', '400')} rounded-full opacity-30`}

                          initial={{

                            x: Math.random() * 100 + "%",

                            y: Math.random() * 100 + "%",

                            scale: 0

                          }}

                          animate={{

                            x: Math.random() * 100 + "%",

                            y: Math.random() * 100 + "%",

                            scale: [0, 1, 0]

                          }}

                          transition={{

                            duration: 3 + Math.random() * 2,

                            repeat: Infinity,

                            delay: Math.random() * 2

                          }}

                        />

                      ))}

                    </motion.div>

                  </div>

                </motion.div>

              ))}

            </motion.div>

          </motion.div>

        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Courses</h2>
                <p className="text-slate-500">Continue where you left off</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    if (setCurrentCourseId) setCurrentCourseId(course.id);
                    setCurrentView('lesson');
                  }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                >
                  <div className={`h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center ${course.thumbnail.startsWith('data:') ? '' : 'p-8'}`}>
                    {course.thumbnail.startsWith('data:') ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : course.thumbnail.startsWith('http') ? (
                      <img src={course.thumbnail} alt={course.title} className="w-24 h-24 object-contain" />
                    ) : (
                      <BookOpen className="text-slate-400" size={48} />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{course.category}</span>
                      <span className="text-xs text-slate-500">Active</span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 truncate">{course.title}</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span>{course.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress || 0}%` }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">Last accessed: {course.lastAccessed || 'Never'}</span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (setCurrentCourseId) setCurrentCourseId(course.id);
                            setCurrentView('lesson');
                          }}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900"
                        >
                          Continue
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <CourseCatalog
              setCurrentView={setCurrentView}
              setCurrentCourseId={setCurrentCourseId}
              onEnrollCourse={(id) => console.log(`Enrolling in course: ${id}`)}
            />
          </motion.div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Your Learning Progress</h2>
                <p className="text-slate-500">Track your journey across the curriculum</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {(() => {
                      const allLessonIds = syllabus.flatMap(s => s.lessons.map((l: any) => l.id));
                      const totalLessons = allLessonIds.length;
                      const completedCount = completedLessons.filter(id => allLessonIds.includes(id)).length;
                      return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                    })()}%
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Overall Completion</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin-slow rotate-[78deg]" />
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between text-sm font-bold text-slate-900 mb-4">
                <span>Core Modules Completion</span>
                {(() => {
                  const allLessonIds = syllabus.flatMap(s => s.lessons.map((l: any) => l.id));
                  const totalLessons = allLessonIds.length;
                  const completedCount = completedLessons.filter(id => allLessonIds.includes(id)).length;
                  return <span>{completedCount} / {totalLessons} Lessons</span>;
                })()}
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(() => {
                      const allLessonIds = syllabus.flatMap(s => s.lessons.map((l: any) => l.id));
                      const totalLessons = allLessonIds.length;
                      const completedCount = completedLessons.filter(id => allLessonIds.includes(id)).length;
                      return totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
                    })()}%`
                  }}
                  className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full shadow-lg shadow-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {syllabus.map((module) => {
                const totalInModule = module.lessons.length;
                const completedInModule = module.lessons.filter((l: any) => completedLessons.includes(l.id)).length;
                const percentage = Math.round((completedInModule / totalInModule) * 100);
                const stats = moduleStats[module.id];

                return (
                  <motion.div
                    key={module.id}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">{module.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {stats?.startTime ? (
                            <span className="flex items-center gap-1"><Clock size={12} /> Started: {new Date(stats.startTime).toLocaleDateString()}</span>
                          ) : (
                            <span>Not started</span>
                          )}
                          {stats?.endTime && (
                            <span className="text-green-600 font-bold ml-2">✓ Completed</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">{percentage}%</div>
                        <div className="text-[10px] text-slate-400">{completedInModule}/{totalInModule} Lessons</div>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}



        {/* Assignments Tab */}

        {activeTab === 'assignments' && (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="space-y-8"

          >

            <h2 className="text-xl font-bold text-slate-900">Assignments</h2>



            {/* Assignment Overview Cards */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              <motion.div

                whileHover={{ scale: 1.02 }}

                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"

              >

                <div className="flex items-center justify-between mb-4">

                  <FileText size={24} />

                  <span className="text-2xl font-bold">12</span>

                </div>

                <div className="text-sm opacity-90">Total Assignments</div>

                <div className="text-xs opacity-75 mt-2">3 this week</div>

              </motion.div>



              <motion.div

                whileHover={{ scale: 1.02 }}

                className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-6 text-white"

              >

                <div className="flex items-center justify-between mb-4">

                  <CheckCircle2 size={24} />

                  <span className="text-2xl font-bold">8</span>

                </div>

                <div className="text-sm opacity-90">Completed</div>

                <div className="text-xs opacity-75 mt-2">On track</div>

              </motion.div>



              <motion.div

                whileHover={{ scale: 1.02 }}

                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"

              >

                <div className="flex items-center justify-between mb-4">

                  <Clock size={24} />

                  <span className="text-2xl font-bold">3</span>

                </div>

                <div className="text-sm opacity-90">Pending</div>

                <div className="text-xs opacity-75 mt-2">2 due soon</div>

              </motion.div>



              <motion.div

                whileHover={{ scale: 1.02 }}

                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"

              >

                <div className="flex items-center justify-between mb-4">

                  <Award size={24} />

                  <span className="text-2xl font-bold">85%</span>

                </div>

                <div className="text-sm opacity-90">Avg Score</div>

                <div className="text-xs opacity-75 mt-2">Above average</div>

              </motion.div>

            </div>



            {/* Assignment Filters */}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

              <div className="flex items-center justify-between mb-6">

                <h3 className="text-lg font-semibold text-slate-900">Assignment List</h3>

                <div className="flex gap-2">

                  <button className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">

                    All

                  </button>

                  <button className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">

                    Pending

                  </button>

                  <button className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">

                    Completed

                  </button>

                  <button className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">

                    Graded

                  </button>

                </div>

              </div>



              <div className="space-y-4">

                {/* Assignment 1 - Pending */}

                <motion.div

                  whileHover={{ x: 4 }}

                  className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer"

                >

                  <div className="flex items-start justify-between mb-4">

                    <div className="flex-1">

                      <div className="flex items-center gap-3 mb-2">

                        <h4 className="font-semibold text-slate-900">Java Control Flow Implementation</h4>

                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">

                          Pending

                        </span>

                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">

                          Due Soon

                        </span>

                      </div>

                      <p className="text-sm text-slate-600 mb-3">Implement a Java program that demonstrates all control flow statements including if-else, switch, for loops, while loops, and do-while loops with practical examples.</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">

                        <span className="flex items-center gap-1">

                          <BookOpen size={12} />

                          Java Fundamentals

                        </span>

                        <span className="flex items-center gap-1">

                          <Target size={12} />

                          Medium

                        </span>

                        <span className="flex items-center gap-1">

                          <Award size={12} />

                          15 points

                        </span>

                        <span className="flex items-center gap-1">

                          <Calendar size={12} />

                          Due: Mar 28, 2024

                        </span>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <div className="text-right">

                        <div className="text-lg font-bold text-blue-600">4 days</div>

                        <div className="text-xs text-slate-500">Time remaining</div>

                      </div>

                      <ChevronRight size={20} className="text-slate-400" />

                    </div>

                  </div>



                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">

                    <div className="flex items-center gap-4">

                      <div className="text-xs text-slate-500">

                        Progress: 0% complete

                      </div>

                      <div className="w-32 bg-slate-200 rounded-full h-2">

                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '0%' }}></div>

                      </div>

                    </div>

                    <motion.button

                      whileHover={{ scale: 1.05 }}

                      whileTap={{ scale: 0.95 }}

                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"

                    >

                      Start Assignment

                    </motion.button>

                  </div>

                </motion.div>



                {/* Assignment 2 - Completed */}

                <motion.div

                  whileHover={{ x: 4 }}

                  className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer"

                >

                  <div className="flex items-start justify-between mb-4">

                    <div className="flex-1">

                      <div className="flex items-center gap-3 mb-2">

                        <h4 className="font-semibold text-slate-900">Object-Oriented Programming Project</h4>

                        <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">

                          Completed

                        </span>

                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">

                          Graded

                        </span>

                      </div>

                      <p className="text-sm text-slate-600 mb-3">Design and implement a comprehensive banking system using OOP principles including inheritance, polymorphism, encapsulation, and abstraction with proper UML documentation.</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">

                        <span className="flex items-center gap-1">

                          <BookOpen size={12} />

                          Java OOP

                        </span>

                        <span className="flex items-center gap-1">

                          <Target size={12} />

                          Hard

                        </span>

                        <span className="flex items-center gap-1">

                          <Award size={12} />

                          25 points

                        </span>

                        <span className="flex items-center gap-1">

                          <Calendar size={12} />

                          Submitted: Mar 20, 2024

                        </span>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <div className="text-right">

                        <div className="text-lg font-bold text-slate-600">22/25</div>

                        <div className="text-xs text-slate-500">Score</div>

                      </div>

                      <ChevronRight size={20} className="text-slate-400" />

                    </div>

                  </div>



                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">

                    <div className="flex items-center gap-4">

                      <div className="text-xs text-slate-500">

                        Grade: A- (Excellent work)

                      </div>

                      <div className="w-32 bg-slate-200 rounded-full h-2">

                        <div className="bg-slate-500 h-2 rounded-full" style={{ width: '88%' }}></div>

                      </div>

                    </div>

                    <motion.button

                      whileHover={{ scale: 1.05 }}

                      whileTap={{ scale: 0.95 }}

                      className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"

                    >

                      View Feedback

                    </motion.button>

                  </div>

                </motion.div>



                {/* Assignment 3 - Submitted */}

                <motion.div

                  whileHover={{ x: 4 }}

                  className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer"

                >

                  <div className="flex items-start justify-between mb-4">

                    <div className="flex-1">

                      <div className="flex items-center gap-3 mb-2">

                        <h4 className="font-semibold text-slate-900">Database Integration Project</h4>

                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">

                          Submitted

                        </span>

                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">

                          Pending Grade

                        </span>

                      </div>

                      <p className="text-sm text-slate-600 mb-3">Create a full-stack application with Spring Boot backend and React frontend, implementing CRUD operations, authentication, and real-time data synchronization.</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">

                        <span className="flex items-center gap-1">

                          <BookOpen size={12} />

                          Full Stack

                        </span>

                        <span className="flex items-center gap-1">

                          <Target size={12} />

                          Hard

                        </span>

                        <span className="flex items-center gap-1">

                          <Award size={12} />

                          30 points

                        </span>

                        <span className="flex items-center gap-1">

                          <Calendar size={12} />

                          Submitted: Mar 25, 2024

                        </span>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <div className="text-right">

                        <div className="text-lg font-bold text-blue-600">-</div>

                        <div className="text-xs text-slate-500">Pending</div>

                      </div>

                      <ChevronRight size={20} className="text-slate-400" />

                    </div>

                  </div>



                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">

                    <div className="flex items-center gap-4">

                      <div className="text-xs text-slate-500">

                        Status: Awaiting review

                      </div>

                      <div className="w-32 bg-slate-200 rounded-full h-2">

                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>

                      </div>

                    </div>

                    <motion.button

                      whileHover={{ scale: 1.05 }}

                      whileTap={{ scale: 0.95 }}

                      className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"

                    >

                      View Submission

                    </motion.button>

                  </div>

                </motion.div>

              </div>

            </div>

          </motion.div>

        )}



        {/* Playground Tab */}
        {activeTab === 'playground' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive Playground</h2>
                <p className="text-slate-500 text-sm mt-1">Multi-language coding environments for hands-on practice</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                      {['JS', 'JV', 'SQ'][i - 1]}
                    </div>
                  ))}
                </div>
                <div className="h-8 w-px bg-slate-200 mx-1" />
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Ready to code
                </div>
              </div>
            </div>

            <PracticeLab />
          </motion.div>
        )}

        {/* Notes Tab */}

        {activeTab === 'notes' && (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="space-y-6"

          >

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-bold text-slate-900">My Notes</h2>

              <motion.button

                whileHover={{ scale: 1.02 }}

                whileTap={{ scale: 0.98 }}

                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"

              >

                <Plus size={16} />

                Add Note

              </motion.button>

            </div>



            {/* Notes Categories */}

            <div className="flex gap-2 flex-wrap">

              {['All', 'Java', 'React', 'Spring Boot', 'MongoDB', 'General'].map((category) => (

                <motion.button

                  key={category}

                  onClick={() => setSelectedCategory(category)}

                  whileHover={{ scale: 1.05 }}

                  whileTap={{ scale: 0.95 }}

                  className={`px-3 py-1 rounded-full text-sm transition-colors ${category === selectedCategory
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}

                >

                  {category}

                </motion.button>

              ))}

            </div>



            {/* Notes Grid */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Sample Notes */}

              {filteredNotes.map((note) => (

                <motion.div

                  key={note.id}

                  // initial={{ opacity: 0, y: 20 }}

                  // animate={{ opacity: 1, y: 0 }}

                  whileHover={{ scale: 1.02, y: -2 }}

                  onClick={() => note.title === 'Java Spring Boot Configuration' && setSelectedNote(note)}

                  className="bg-white rounded-xl shadow-lg shadow-slate-300/50 border border-slate-200 p-4 cursor-pointer hover:shadow-xl hover:shadow-slate-400/60 transition-all"

                >

                  <div className="flex items-start justify-between mb-1">

                    <div className="flex items-center gap-2">

                      <div className={`w-2 h-2 rounded-full ${note.category === 'Java' ? 'bg-red-500' :

                        note.category === 'React' ? 'bg-cyan-500' :

                          note.category === 'Spring Boot' ? 'bg-green-500' :

                            note.category === 'MongoDB' ? 'bg-emerald-500' :

                              'bg-slate-500'

                        }`}></div>

                      <span className="text-xs font-medium text-slate-600">{note.category}</span>

                    </div>

                    <div className="flex items-center gap-1">

                      <button className="p-1 text-slate-400 hover:text-red-600">

                        <Trash2 size={14} />

                      </button>

                    </div>

                  </div>



                  <h3 className="font-semibold text-slate-900 mb-2">{note.title}</h3>



                  <p className="text-sm text-slate-600 mb-3 line-clamp-3">{note.content}</p>



                  <div className="flex items-center justify-between text-xs text-slate-500">

                    <div className="flex items-center gap-1">

                      <Calendar size={12} />

                      <span>{note.date}</span>

                    </div>

                    <div className="flex items-center gap-1">

                      <Clock size={12} />

                      <span>{note.time}</span>

                    </div>

                  </div>

                </motion.div>

              ))}

            </div>



            {/* Empty State */}

            {filteredNotes.length === 0 && (

              <div className="text-center py-12">

                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">

                  <FileText size={32} className="text-slate-400" />

                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {selectedCategory === 'All' ? 'No notes yet' : `No ${selectedCategory} notes yet`}
                </h3>

                <p className="text-slate-500 mb-4">
                  {selectedCategory === 'All'
                    ? 'Start taking notes for your courses'
                    : `Try creating notes for ${selectedCategory} or select a different category`
                  }
                </p>

                <motion.button

                  whileHover={{ scale: 1.02 }}

                  whileTap={{ scale: 0.98 }}

                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"

                >

                  {selectedCategory === 'All' ? 'Create Your First Note' : 'Create Note'}

                </motion.button>

              </div>

            )}

          </motion.div>

        )}



        {/* Note Detail Modal */}

        {selectedNote && (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 ${isModalMaximized ? 'p-0' : 'p-4'}`}
            onClick={() => setSelectedNote(null)}
          >

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white shadow-2xl transition-all duration-300 ${isModalMaximized
                ? 'w-full h-full rounded-none'
                : 'max-w-2xl w-full max-h-[85vh] rounded-2xl'
                } overflow-hidden flex flex-col`}
            >

              {/* Modal Header */}

              <div className="bg-white/20 backdrop-blur-sm p-6 text-black border-b border-slate-200">

                <div className="flex items-start justify-between">

                  <div>

                    <h2 className="text-2xl font-bold mb-2">{selectedNote.title}</h2>

                    <div className="flex items-center gap-3 text-black">

                      <div className="flex items-center gap-2">

                        <div className="w-3 h-3 bg-black rounded-full"></div>

                        <span className="font-medium">{selectedNote.category}</span>

                      </div>

                      <div className="flex items-center gap-1">

                        <Calendar size={14} />

                        <span>{selectedNote.date}</span>

                      </div>

                      <div className="flex items-center gap-1">

                        <Clock size={14} />

                        <span>{selectedNote.time}</span>

                      </div>

                    </div>

                  </div>



                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsModalMaximized(!isModalMaximized)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-sm font-bold"
                      title={isModalMaximized ? "Minimize" : "Maximize"}
                    >
                      {isModalMaximized ? (
                        <>
                          <ArrowLeft size={16} />
                          <span>Back</span>
                        </>
                      ) : (
                        <>
                          <Maximize size={16} />
                          <span>Maximize</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedNote(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                      <X size={20} />
                    </button>
                  </div>

                </div>

              </div>



              {/* Modal Content */}

              <div className={`p-6 overflow-y-auto ${isModalMaximized ? 'max-h-[85vh]' : 'max-h-[60vh]'
                }`}>

                <div className="prose prose-slate max-w-none">

                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Note Content</h3>



                  <div className="mb-6">
                    {isEditing ? (
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-96 p-6 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-800 leading-relaxed font-medium"
                        placeholder="Edit your note content..."
                      />
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 shadow-inner">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">{selectedNote.content}</p>
                      </div>
                    )}
                  </div>



                  {/* Additional Note Details */}

                  <div className="border-t border-slate-200 pt-4">

                    <h4 className="font-semibold text-slate-900 mb-3">Key Points</h4>

                    <ul className="space-y-2 text-slate-600">

                      {selectedNote.category === 'Java' && selectedNote.title === 'Java Spring Boot Configuration' && (

                        <>

                          <li className="flex items-start gap-2">

                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>

                            <span>Configure application.properties for database connections</span>

                          </li>

                          <li className="flex items-start gap-2">

                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>

                            <span>Set up dependency injection with @Component and @Autowired</span>

                          </li>

                          <li className="flex items-start gap-2">

                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>

                            <span>Configure server port: server.port=8080</span>

                          </li>

                          <li className="flex items-start gap-2">

                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>

                            <span>Database URL: spring.datasource.url=jdbc:mysql://localhost:3306/dbname</span>

                          </li>

                          <li className="flex items-start gap-2">

                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>

                            <span>Enable JPA repositories with @EnableJpaRepositories</span>

                          </li>

                        </>

                      )}

                    </ul>

                  </div>



                  {/* Action Buttons */}

                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">

                    {isEditing && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (selectedNote) {
                              // Find and update the note in the notes array
                              const noteIndex = notes.findIndex(note => note.id === selectedNote.id);
                              if (noteIndex !== -1) {
                                notes[noteIndex].content = editedContent;
                                setSelectedNote({ ...selectedNote, content: editedContent });
                              }
                              setIsEditing(false);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Save
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(selectedNote?.content || '');
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <X size={16} />
                          Cancel
                        </motion.button>
                      </>
                    )}

                    {!isEditing && (
                      <motion.button

                        whileHover={{ scale: 1.02 }}

                        whileTap={{ scale: 0.98 }}

                        onClick={() => {
                          if (selectedNote) {
                            setIsEditing(true);
                            setEditedContent(selectedNote.content);
                          }
                        }}

                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"

                      >

                        <Edit size={16} />

                        Edit Note

                      </motion.button>
                    )}



                    <motion.button

                      whileHover={{ scale: 1.02 }}

                      whileTap={{ scale: 0.98 }}

                      onClick={() => {
                        if (selectedNote) {
                          // Generate a shareable link with note data
                          const noteData = {
                            id: selectedNote.id,
                            title: selectedNote.title,
                            category: selectedNote.category,
                            content: selectedNote.content,
                            date: selectedNote.date,
                            time: selectedNote.time
                          };
                          const encodedData = btoa(JSON.stringify(noteData));
                          const link = `${window.location.origin}${window.location.pathname}?note=${encodedData}`;
                          setShareLink(link);
                          setShowShareModal(true);
                        }
                      }}

                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"

                    >

                      <Share2 size={16} />

                      Share

                    </motion.button>



                    <motion.button

                      whileHover={{ scale: 1.02 }}

                      whileTap={{ scale: 0.98 }}

                      onClick={() => {
                        if (selectedNote) {
                          // Create a new window for printing
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            // Process content to make headings bold
                            const processedContent = selectedNote.content
                              .replace(/^(🌱 What is Spring Boot\?)/gm, '<strong>$1</strong>')
                              .replace(/^(⚙️ 1\. Prerequisites)/gm, '<strong>$1</strong>')
                              .replace(/^(🚀 2\. Creating a Spring Boot Project)/gm, '<strong>$1</strong>')
                              .replace(/^(📁 3\. Project Structure)/gm, '<strong>$1</strong>')
                              .replace(/^(🧠 4\. Main Application Class)/gm, '<div style="page-break-before: always;"></div><strong>$1</strong>')
                              .replace(/^(🔧 5\. Spring Boot Configuration)/gm, '<strong>$1</strong>')
                              .replace(/^(🔁 6\. Auto Configuration Concept)/gm, '<strong>$1</strong>')
                              .replace(/^(🌐 7\. Creating a Simple REST Controller)/gm, '<div style="page-break-before: always;"></div><strong>$1</strong>')
                              .replace(/^(▶️ 8\. Running the Application)/gm, '<strong>$1</strong>')
                              .replace(/^(🌍 9\. Output)/gm, '<strong>$1</strong>')
                              .replace(/^(🧩 10\. Key Annotations Summary)/gm, '<strong>$1</strong>')
                              .replace(/^(🏁 Final Flow)/gm, '<strong>$1</strong>')
                              .replace(/^(Key Points)/gm, '<strong>$1</strong>')
                              .replace(/^(Explanation:)/gm, '<strong>$1</strong>')
                              .replace(/^(Method 1: Using Spring Initializr)/gm, '<strong>$1</strong>')
                              .replace(/^(Steps:)/gm, '<strong>$1</strong>')
                              .replace(/^(Important folders:)/gm, '<strong>$1</strong>')
                              .replace(/^(Spring Boot automatically:)/gm, '<strong>$1</strong>')
                              .replace(/^(👉 Based on:)/gm, '<strong>$1</strong>')
                              .replace(/^(Using IDE:)/gm, '<strong>$1</strong>')
                              .replace(/^(Open browser:)/gm, '<strong>$1</strong>')
                              .replace(/^(Output:)/gm, '<strong>$1</strong>')
                              .replace(/^(Annotation\tPurpose)/gm, '<strong>Annotation&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Purpose</strong>')
                              .replace(/^(Annotation\s+Purpose)/gm, '<strong>Annotation&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&10;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Purpose</strong>')
                              .replace(/^(@SpringBootApplication\s+Main config)/gm, '@SpringBootApplication&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Main config')
                              .replace(/^(@RestController\s+REST API)/gm, '@RestController&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;REST API')
                              .replace(/^(@GetMapping\s+HTTP GET)/gm, '@GetMapping&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&10;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HTTP GET')
                              .replace(/^(@Autowired\s+Dependency injection)/gm, '@Autowired&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&10;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Dependency injection')
                              .replace(/^(Flow:)/gm, '<strong>$1</strong>')
                              .replace(/\n/g, '<br>');

                            const noteContent = `
                              <html>
                                <head>
                                  <title>${selectedNote.title}</title>
                                  <style>
                                    body { 
                                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                      line-height: 1.6; 
                                      margin: 40px; 
                                      color: #333;
                                      text-align: left;
                                    }
                                    h1 { 
                                      color: #000000; 
                                      border-bottom: none; 
                                      padding-bottom: 10px; 
                                      font-weight: bold;
                                      font-size: 24px;
                                      text-align: center;
                                    }
                                    .metadata { 
                                      background: #f8fafc; 
                                      padding: 15px; 
                                      border-radius: 8px; 
                                      margin: 20px 0; 
                                      border-left: 4px solid #2563eb;
                                    }
                                    .metadata-item { 
                                      margin: 5px 0; 
                                      font-weight: 500;
                                    }
                                    .content { 
                                      white-space: pre-wrap; 
                                      margin-top: 20px;
                                      font-size: 14px;
                                      text-align: left;
                                    }
                                    @media print {
                                      body { margin: 20px; }
                                      .no-print { display: none; }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <h1>${selectedNote.title}</h1>
                                  <div class="content">${processedContent}</div>
                                  <script>
                                    window.onload = function() {
                                      setTimeout(() => {
                                        window.print();
                                        window.close();
                                      }, 500);
                                    };
                                  </script>
                                </body>
                              </html>
                            `;
                            printWindow.document.write(noteContent);
                            printWindow.document.close();
                          }
                        }
                      }}

                      className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"

                    >

                      <Download size={16} />

                      Export

                    </motion.button>

                  </div>

                </div>

              </div>

            </motion.div>

          </motion.div>

        )}



        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Share Note</h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Shareable Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        // You could add a toast notification here
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Anyone with this link can view this note. The link contains all note data and can be shared via email, messaging apps, or social media.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Rating Tab */}

        {activeTab === 'rating' && (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="space-y-4"

          >

            <motion.button

              whileHover={{ scale: 1.03 }}

              whileTap={{ scale: 0.97 }}

              onClick={() => setShowRatingPrompt(true)}

              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"

            >

              <Star size={16} />

              Give Rating

            </motion.button>

            {lastSubmittedRating && (

              <div className="text-sm text-slate-700 inline-flex items-center gap-2 ml-3">

                <CheckCircle2 size={16} />

                Thanks! You submitted a {lastSubmittedRating}-star rating.

              </div>

            )}

            {
              perCoursePieData.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-48 my-8">
                  {perCoursePieData.map((course) => (
                    <div key={course.courseId} className="relative w-[20rem] h-[20rem] min-w-[20rem] min-h-[20rem] max-w-[20rem] max-h-[20rem] rounded-full flex-shrink-0" style={course.chartStyle}>
                      <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
                        {course.centerImage ? (
                          <img
                            src={course.centerImage}
                            alt={course.courseTitle}
                            className="w-24 h-24 object-contain"
                          />
                        ) : (
                          <div className="text-center leading-tight">
                            <div className="text-3xl font-bold text-slate-700">{course.courseInitials}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            <div className="space-y-3">

              {courseRatings.map((item) => (

                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="text-sm font-semibold text-slate-900">{item.courseTitle}</div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">

                        <User size={12} />

                        {item.userName}

                        <span>•</span>

                        <Clock size={12} />

                        {item.time}

                      </div>

                    </div>

                    <div className="flex items-center gap-1">

                      {[...Array(5)].map((_, i) => (

                        <Star

                          key={i}

                          size={14}

                          className={i < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}

                        />

                      ))}

                    </div>

                  </div>

                  {item.comment && (

                    <p className="text-sm text-slate-600 mt-3">{item.comment}</p>

                  )}

                </div>

              ))}

            </div>

            {showRatingPrompt && (

              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                <motion.div

                  initial={{ opacity: 0, scale: 0.95, y: 10 }}

                  animate={{ opacity: 1, scale: 1, y: 0 }}

                  className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6"

                >

                  <h4 className="text-lg font-semibold text-slate-900 mb-1">Rate Your Experience</h4>

                  <p className="text-sm text-slate-500 mb-5">Choose a course and submit your rating.</p>

                  <div className="mb-4">

                    <label className="text-sm font-medium text-slate-700 block mb-2">Course</label>

                    <select

                      value={selectedCourseForRating}

                      onChange={(e) => setSelectedCourseForRating(e.target.value)}

                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"

                    >

                      {enrolledCourses.map((course) => (

                        <option key={course.id} value={course.id}>

                          {course.title}

                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="flex items-center justify-center gap-2 mb-6">

                    {[1, 2, 3, 4, 5].map((star) => (

                      <button

                        key={star}

                        type="button"

                        onClick={() => setSelectedRating(star)}

                        onMouseEnter={() => setHoverRating(star)}

                        onMouseLeave={() => setHoverRating(0)}

                        className="p-1"

                      >

                        <Star

                          size={30}

                          className={`${(hoverRating || selectedRating) >= star ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'} transition-colors`}

                        />

                      </button>

                    ))}

                  </div>

                  <div className="mb-5">

                    <label className="text-sm font-medium text-slate-700 block mb-2">Comment (optional)</label>

                    <textarea

                      value={ratingComment}

                      onChange={(e) => setRatingComment(e.target.value)}

                      placeholder="Write a short feedback..."

                      rows={3}

                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500 resize-none"

                    />

                  </div>

                  <div className="flex items-center justify-end gap-3">

                    <button

                      type="button"

                      onClick={() => setShowRatingPrompt(false)}

                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"

                    >

                      Cancel

                    </button>

                    <motion.button

                      whileHover={{ scale: selectedRating ? 1.03 : 1 }}

                      whileTap={{ scale: selectedRating ? 0.97 : 1 }}

                      type="button"

                      disabled={!selectedRating}

                      onClick={() => {

                        const selectedCourse = enrolledCourses.find((course) => course.id === selectedCourseForRating);

                        if (!selectedCourse) return;

                        setCourseRatings((prev) => [
                          {
                            id: `r-${Date.now()}`,
                            userName: user?.user_metadata?.display_name || user?.email || 'Student',
                            courseId: selectedCourse.id,
                            courseTitle: selectedCourse.title,
                            rating: selectedRating,
                            comment: ratingComment.trim(),
                            time: 'Just now'
                          },
                          ...prev
                        ]);

                        setLastSubmittedRating(selectedRating);

                        setShowRatingPrompt(false);

                        setSelectedRating(0);

                        setHoverRating(0);

                        setRatingComment('');

                      }}

                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

                    >

                      <Send size={14} />

                      Submit Rating

                    </motion.button>

                  </div>

                </motion.div>

              </div>

            )}

          </motion.div>

        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">Resource Library</h2>
                </div>
                <p className="text-slate-500">Access exclusive study materials and PDFs</p>
              </div>
              <div className="flex w-full sm:w-auto gap-3 flex-wrap">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>


                {/* Enabled upload for both admins and users as per request */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <Plus size={18} />
                  Add File
                </button>
              </div>
            </div>



            {/* Library Categories */}
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap pb-2">
                {['All', 'PDFs', 'Images'].map((category: any) => (
                  <motion.button
                    key={String(category)}
                    onClick={() => {
                      setSelectedLibraryCategory(String(category));
                      setSelectedLibrarySubTopic('All');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${category === selectedLibraryCategory
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {libraryResources
                .filter(resource => {
                  // Filter out hidden resources
                  if (hiddenResourceIds.includes(resource.id)) return false;

                  const matchesCategory = selectedLibraryCategory === 'All' ||
                    (selectedLibraryCategory === 'PDFs' && resource.type === 'pdf') ||
                    (selectedLibraryCategory === 'Images' && resource.type === 'image') ||
                    resource.category === selectedLibraryCategory;

                  const matchesSubTopic = selectedLibrarySubTopic === 'All' ||
                    (resource as any).subTopic === selectedLibrarySubTopic;

                  const matchesSearch = resource.title.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                    resource.category.toLowerCase().includes(librarySearchQuery.toLowerCase());

                  return matchesCategory && matchesSubTopic && matchesSearch;
                })
                .map((resource) => (
                  <motion.div
                    key={resource.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-44 bg-slate-50 rounded-xl flex items-center justify-center mb-4 relative group overflow-hidden">
                      <img
                        src={resource.type === 'image' ? resource.downloadUrl : resource.thumbnail}
                        alt={resource.title}
                        className={`${resource.type === 'image' ? 'w-full h-full object-cover' : 'w-16 h-16 object-contain'} group-hover:scale-110 transition-transform`}
                      />

                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-white rounded-full text-slate-900 shadow-lg"
                          title={resource.type === 'image' ? "View Image" : "View PDF"}
                          onClick={() => openFileInViewer(resource)}
                        >
                          <Eye size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-white rounded-full text-blue-600 shadow-lg"
                          title={resource.type === 'image' ? "Download Image" : "Download PDF"}
                          onClick={() => handleDownload(resource.downloadUrl, resource.title + (resource.type === 'image' ? '.png' : '.pdf'))}
                        >
                          <Download size={18} />
                        </motion.button>
                        {isAdmin && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-white rounded-full text-red-600 shadow-lg"
                            title="Delete Resource"
                            onClick={() => handleDeleteResource(resource.id)}
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${resource.category === 'Books' ? 'bg-purple-100 text-purple-700' :
                          resource.category === 'PDFs' ? 'bg-blue-100 text-blue-700' :
                            resource.category === 'Python' ? 'bg-yellow-100 text-yellow-700' :
                              resource.category === 'DSA' ? 'bg-indigo-100 text-indigo-700' :
                                resource.category === 'Cyber Security' ? 'bg-red-100 text-red-700' :
                                  resource.category === 'Images' ? 'bg-purple-100 text-purple-700' :
                                    'bg-emerald-100 text-emerald-700'
                          }`}>
                          {resource.category}
                        </span>
                        {(resource as any).source === 'drive' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1">
                            <Globe size={10} />
                            Drive
                          </span>
                        )}
                        {(resource as any).subTopic && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {(resource as any).subTopic}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium ml-auto">{resource.size}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 truncate">{resource.title}</h3>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openFileInViewer(resource)}
                        className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-slate-800"
                      >
                        <Eye size={14} />
                        {resource.type === 'image' ? 'View Image' : 'Read Now'}
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                        onClick={() => handleDownload(resource.downloadUrl, resource.title + (resource.type === 'image' ? '.png' : '.pdf'))}
                      >
                        <Download size={14} />
                      </motion.button>
                      {isAdmin && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                          title="Delete"
                          onClick={() => handleDeleteResource(resource.id)}
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>

          </motion.div>
        )}

      </main>

      {/* Fullscreen Integrated Resource Viewer (Images & PDFs) */}
      <AnimatePresence>
        {selectedResourceForView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col overflow-hidden"
          >
            {/* Integrated Header Toolbar */}
            <div className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-8 shrink-0 shadow-2xl z-[110]">
              <div className="flex items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedResourceForView(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold pr-6 border-r border-white/10"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Library</span>
                </motion.button>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${selectedResourceForView.type === 'image' ? 'bg-purple-500/10' : 'bg-blue-500/10'} border border-white/5`}>
                    {selectedResourceForView.type === 'image' ?
                      <Grid size={22} className="text-purple-400" /> :
                      <FileText size={22} className="text-blue-400" />
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-base leading-tight text-white tracking-tight">
                      {selectedResourceForView.title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      {selectedResourceForView.category} • {selectedResourceForView.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedResourceForView.downloadUrl.includes('drive.google.com') && (
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(59,130,246,0.15)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(selectedResourceForView.downloadUrl.replace('/preview', '/view'), '_blank')}
                    className="flex items-center gap-2.5 px-4 py-2 text-blue-400 hover:text-blue-300 rounded-xl transition-all text-xs font-bold border border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5"
                    title="Open in new window"
                  >
                    <ExternalLink size={18} />
                    <span className="hidden sm:inline">Check Original</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(selectedResourceForView.downloadUrl, selectedResourceForView.title + (selectedResourceForView.type === 'image' ? '.png' : '.pdf'))}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white rounded-xl transition-all text-xs font-bold border border-white/10 hover:border-white/20 bg-white/5"
                  title={selectedResourceForView.type === 'image' ? "Download Image" : "Download PDF"}
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Download</span>
                </motion.button>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90, backgroundColor: 'rgba(239,68,68,0.15)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedResourceForView(null)}
                  className="p-2.5 text-slate-400 hover:text-red-400 rounded-xl transition-all bg-white/5 hover:bg-red-500/10"
                  title="Exit Fullscreen"
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            {/* Viewer Content Area */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,41,59,1)_0%,rgba(15,23,42,1)_100%)] opacity-50" />
              <div className="relative w-full h-full z-10">
                {selectedResourceForView.type === 'image' ? (
                  <div className="w-full h-full p-6 sm:p-12 flex items-center justify-center bg-slate-950">
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={getViewerUrl(selectedResourceForView.downloadUrl)}
                      alt={selectedResourceForView.title}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-white/5"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <iframe
                      src={getViewerUrl(selectedResourceForView.downloadUrl)}
                      className="w-full h-full border-none"
                      title={selectedResourceForView.title}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 pointer-events-none -z-10">
                      <div className="text-center p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
                        <p className="text-slate-600 mb-4">If the PDF doesn't load, you can open it directly:</p>
                        <button
                          onClick={() => window.open(getViewerUrl(selectedResourceForView.downloadUrl).replace('&embedded=true', ''), '_blank')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold pointer-events-auto"
                        >
                          Open in New Tab
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload File Modal */}
      <AnimatePresence />
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowUploadModal(false)}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Upload Resource</h3>
                  <p className="text-xs font-semibold text-slate-500">Add a new PDF or Image</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Resource Name</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter course or material title"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-800 font-medium placeholder:text-slate-400/80"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                <input
                  type="text"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="e.g. General, Python, Cyber Security"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-800 font-medium placeholder:text-slate-400/80"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">File</label>
                <div className="relative group">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                      }`}
                  >
                    {uploadFile ? (
                      <div className="flex flex-col items-center text-blue-600">
                        <CheckCircle2 size={32} className="mb-2" />
                        <span className="text-sm font-semibold text-center px-4 truncate w-full">{uploadFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-500">
                        <Download size={32} className="mb-2" />
                        <span className="text-sm font-medium">Click to select PDF or Image</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || !uploadTitle || isUploading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence />
    </div>
  );
}
