import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const AdminContext = createContext();

import { API_BASE } from '../config/api';

export function AdminProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(!!localStorage.getItem('admin_token'));
    const [siteSettings, setSiteSettings] = useState({
        navbar: null,
        hero: null,
        about: null,
        resume: null,
        contact: null,
        footer: null,
        seo: null,
        global: null,
        theme: null
    });

    // Refresh dynamic data hooks
    const [projects, setProjects] = useState([]);
    const [services, setServices] = useState([]);
    const [skills, setSkills] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [messages, setMessages] = useState([]);
    const [media, setMedia] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // Progressive loading states
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);
    const [isServicesLoading, setIsServicesLoading] = useState(true);
    const [isSkillsLoading, setIsSkillsLoading] = useState(true);
    const [isExperiencesLoading, setIsExperiencesLoading] = useState(true);
    const [isFaqsLoading, setIsFaqsLoading] = useState(true);
    const [isTestimonialsLoading, setIsTestimonialsLoading] = useState(true);
    const [isMediaLoading, setIsMediaLoading] = useState(true);

    // Save token to localStorage
    useEffect(() => {
        if (token) {
            localStorage.setItem('admin_token', token);
            fetchProfile();
        } else {
            localStorage.removeItem('admin_token');
            setUser(null);
        }
    }, [token]);

    // Load initial website configurations & keep synced on window focus / tab switch
    useEffect(() => {
        loadPublicData();

        const handleFocus = () => {
            loadPublicData();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadPublicData();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [token]);

    const loadPublicData = async () => {
        setIsSettingsLoading(true);
        setIsProjectsLoading(true);
        setIsServicesLoading(true);
        setIsSkillsLoading(true);
        setIsExperiencesLoading(true);
        setIsFaqsLoading(true);
        setIsTestimonialsLoading(true);

        let isNetworkError = false;
        try {
            const headers = { 'Cache-Control': 'no-cache' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // High-speed consolidated bootstrap query with cache-busting
            const res = await fetch(`${API_BASE}/bootstrap?t=${Date.now()}`, { headers, cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.settings) setSiteSettings(data.settings);
                if (data.projects) setProjects(data.projects || []);
                if (data.services) setServices(data.services || []);
                if (data.skills) setSkills(data.skills || []);
                if (data.experiences) setExperiences(data.experiences || []);
                if (data.faqs) setFaqs(data.faqs || []);
                if (data.testimonials) setTestimonials(data.testimonials || []);
                return;
            }
        } catch (error) {
            isNetworkError = error instanceof TypeError || error?.name === 'TypeError';
            console.warn('Bootstrap endpoint unavailable:', error.message || error);
        } finally {
            setIsSettingsLoading(false);
            setIsProjectsLoading(false);
            setIsServicesLoading(false);
            setIsSkillsLoading(false);
            setIsExperiencesLoading(false);
            setIsFaqsLoading(false);
            setIsTestimonialsLoading(false);
        }

        if (isNetworkError) {
            console.warn('Backend server is offline or unreachable at:', API_BASE);
            return;
        }

        // Granular fallback logic if bootstrap route returned non-OK HTTP status
        const modules = ['navbar', 'hero', 'about', 'resume', 'contact', 'footer', 'seo', 'global', 'theme'];
        const settingsData = { ...siteSettings };
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        await Promise.all(
            modules.map(async (mod) => {
                try {
                    const res = await fetch(`${API_BASE}/settings/${mod}`, { headers });
                    if (res.ok) settingsData[mod] = await res.json();
                } catch (err) {
                    console.error(`Failed to load ${mod} settings:`, err);
                }
            })
        );
        setSiteSettings(settingsData);
    };

    const fetchProfile = async () => {
        if (!token) {
            setIsProfileLoading(false);
            return;
        }
        setIsProfileLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Profile load error:', error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    const safeParseJson = async (res) => {
        try {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch {
                return { message: text || `Server responded with status ${res.status}` };
            }
        } catch (e) {
            return { message: e.message || 'Network parsing error' };
        }
    };

    const login = async (username, password) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await safeParseJson(res);
            if (res.ok) {
                setToken(data.token);
                setLoading(false);
                return { success: true };
            } else {
                setLoading(false);
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            setLoading(false);
            return { success: false, message: error.message || 'Server connection error' };
        }
    };

    const logout = () => {
        setToken('');
        setUser(null);
    };

    const changePassword = async (oldPassword, newPassword) => {
        try {
            const res = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await safeParseJson(res);
            return { success: res.ok, message: data.message };
        } catch (error) {
            return { success: false, message: error.message || 'Server connection error' };
        }
    };

    const updateAccount = async (username, currentPassword, newPassword) => {
        try {
            const res = await fetch(`${API_BASE}/auth/update-account`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, currentPassword, newPassword })
            });
            const data = await safeParseJson(res);
            if (res.ok && data.user) {
                setUser(data.user);
            }
            return { success: res.ok, message: data.message };
        } catch (error) {
            return { success: false, message: error.message || 'Server connection error' };
        }
    };

    // Singleton settings updates
    const updateSettings = async (moduleName, settingsBody) => {
        try {
            const res = await fetch(`${API_BASE}/settings/${moduleName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settingsBody)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setSiteSettings(prev => ({ ...prev, [moduleName]: data }));
                await loadPublicData();
                return { success: true };
            }
            return { success: false, message: data.error || data.message || 'Failed to save settings' };
        } catch (error) {
            return { success: false, message: error.message || 'Network error' };
        }
    };

    // Generic CRUD helper generator
    const makeCrud = (routeSegment, stateSetter) => {
        const fetchAll = async () => {
            const res = await fetch(`${API_BASE}/${routeSegment}?t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' },
                cache: 'no-store'
            });
            if (res.ok) stateSetter(await res.json());
        };

        return {
            getAll: fetchAll,
            create: async (item) => {
                const res = await fetch(`${API_BASE}/${routeSegment}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    await fetchAll();
                    await loadPublicData();
                    return { success: true };
                }
                const errData = await res.json().catch(() => ({}));
                return { success: false, message: errData.error || errData.message || 'Failed to create item' };
            },
            update: async (id, item) => {
                const res = await fetch(`${API_BASE}/${routeSegment}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    await fetchAll();
                    await loadPublicData();
                    return { success: true };
                }
                const errData = await res.json().catch(() => ({}));
                return { success: false, message: errData.error || errData.message || 'Failed to update item' };
            },
            delete: async (id) => {
                // Immediately remove from React state to prevent UI flicker or stale rendering
                stateSetter(prev => prev.filter(item => (item._id || item.id) !== id));
                const res = await fetch(`${API_BASE}/${routeSegment}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    await fetchAll();
                    await loadPublicData();
                    return { success: true };
                } else {
                    // Revert if request failed
                    await fetchAll();
                    return { success: false };
                }
            }
        };
    };

    const projectsCrud = makeCrud('projects', setProjects);
    const servicesCrud = makeCrud('services', setServices);
    const skillsCrud = makeCrud('skills', setSkills);
    const experiencesCrud = makeCrud('experiences', setExperiences);
    const faqsCrud = makeCrud('faqs', setFaqs);
    const testimonialsCrud = makeCrud('testimonials', setTestimonials);

    // Messages (inbox)
    const fetchMessages = async () => {
        if (!token) return;
        const res = await fetch(`${API_BASE}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setMessages(await res.json());
    };

    const updateMessageStatus = async (id, statusBody) => {
        const res = await fetch(`${API_BASE}/messages/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(statusBody)
        });
        if (res.ok) await fetchMessages();
    };

    const deleteMessage = async (id) => {
        const res = await fetch(`${API_BASE}/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) await fetchMessages();
    };

    const submitContactMessage = async (msg) => {
        try {
            const res = await fetch(`${API_BASE}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            });
            return { success: res.ok };
        } catch {
            return { success: false };
        }
    };

    // Media
    const fetchMedia = async () => {
        setIsMediaLoading(true);
        try {
            const res = await fetch(`${API_BASE}/media`);
            if (res.ok) setMedia(await res.json());
        } catch (err) {
            console.error('Failed to fetch media:', err);
        } finally {
            setIsMediaLoading(false);
        }
    };

    const uploadMediaFile = async (file, retries = 2) => {
        const formData = new FormData();
        formData.append('file', file);
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await fetch(`${API_BASE}/media/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) {
                    const uploaded = await res.json();
                    await fetchMedia();
                    return {
                        success: true,
                        url: uploaded.url || uploaded.fileUrl,
                        public_id: uploaded.public_id || uploaded.publicId,
                        publicId: uploaded.publicId || uploaded.public_id
                    };
                }
                const errData = await res.json().catch(() => ({}));
                if (attempt === retries) {
                    return { success: false, message: errData.error || errData.message || 'Upload failed' };
                }
            } catch (err) {
                if (attempt === retries) {
                    return { success: false, message: err.message || 'Network error during upload' };
                }
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        return { success: false };
    };

    const uploadMultipleMediaFiles = async (filesArray, retries = 2) => {
        if (!filesArray || filesArray.length === 0) return { success: false, files: [] };
        const formData = new FormData();
        Array.from(filesArray).forEach(file => formData.append('files', file));
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await fetch(`${API_BASE}/media/upload-multiple`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    await fetchMedia();
                    return { success: true, files: data.files || [] };
                }
                const errData = await res.json().catch(() => ({}));
                if (attempt === retries) {
                    return { success: false, message: errData.error || 'Batch upload failed' };
                }
            } catch (err) {
                if (attempt === retries) {
                    return { success: false, message: err.message || 'Network error during batch upload' };
                }
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        return { success: false, files: [] };
    };

    const deleteCloudinaryMedia = async (publicIdOrUrl) => {
        try {
            const res = await fetch(`${API_BASE}/media/delete-cloudinary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ public_id: publicIdOrUrl, url: publicIdOrUrl })
            });
            return { success: res.ok };
        } catch (err) {
            console.error('Delete Cloudinary media error:', err);
            return { success: false };
        }
    };

    const deleteMediaFile = async (id) => {
        const res = await fetch(`${API_BASE}/media/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            await fetchMedia();
            return { success: true };
        }
        return { success: false };
    };

    const replaceMediaFile = async (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/media/replace/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                await fetchMedia();
                return { success: true };
            }
            return { success: false };
        } catch {
            return { success: false };
        }
    };

    // Dashboard Analytics
    const fetchAnalytics = async () => {
        if (!token) return;
        const res = await fetch(`${API_BASE}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAnalytics(await res.json());
    };

    const downloadCv = async () => {
        const resumeUrl = siteSettings?.resume?.resumeUrl;
        if (!resumeUrl) {
            alert("CV document not found. Please configure/upload it in the Admin Panel.");
            return;
        }

        let fullUrl = resumeUrl;
        const baseUrl = API_BASE.replace('/api', '');

        if (resumeUrl.startsWith("/uploads")) {
            fullUrl = `${baseUrl}${resumeUrl}`;
        } else if (resumeUrl.startsWith("uploads/")) {
            fullUrl = `${baseUrl}/${resumeUrl}`;
        } else if (resumeUrl.includes("res.cloudinary.com") && resumeUrl.includes("/upload/")) {
            fullUrl = resumeUrl.replace("/upload/", "/upload/fl_attachment/");
        }

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error("File not found on server");
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', 'faheem_cv.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("CV download error:", error);
            alert("CV file not found or could not be downloaded. Please verify it in the Admin panel.");
        }
    };

    const contextValue = useMemo(() => ({
        token,
        user,
        loading,
        isSettingsLoading,
        isProfileLoading,
        isProjectsLoading,
        isServicesLoading,
        isSkillsLoading,
        isExperiencesLoading,
        isFaqsLoading,
        isTestimonialsLoading,
        isMediaLoading,
        siteSettings,
        downloadCv,
        projects,
        services,
        skills,
        experiences,
        faqs,
        testimonials,
        messages,
        media,
        analytics,
        login,
        logout,
        changePassword,
        updateAccount,
        loadPublicData,
        updateSettings,
        projectsCrud,
        servicesCrud,
        skillsCrud,
        experiencesCrud,
        faqsCrud,
        testimonialsCrud,
        fetchMessages,
        updateMessageStatus,
        deleteMessage,
        submitContactMessage,
        fetchMedia,
        uploadMediaFile,
        uploadMultipleMediaFiles,
        deleteCloudinaryMedia,
        deleteMediaFile,
        replaceMediaFile,
        fetchAnalytics
    }), [
        token,
        user,
        loading,
        isSettingsLoading,
        isProfileLoading,
        isProjectsLoading,
        isServicesLoading,
        isSkillsLoading,
        isExperiencesLoading,
        isFaqsLoading,
        isTestimonialsLoading,
        isMediaLoading,
        siteSettings,
        projects,
        services,
        skills,
        experiences,
        faqs,
        testimonials,
        messages,
        media,
        analytics
    ]);

    return (
        <AdminContext.Provider value={contextValue}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}
