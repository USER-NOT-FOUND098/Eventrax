import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, MapPin, DollarSign, Image, Sparkles, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Sample event images for visual appeal
const sampleBanners = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=400&fit=crop',
];

export function CreateEvent() {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useAuth();
    const { collapsed } = useSidebar();
    const isAdmin = user?.role === 'admin';
    const isEditMode = !!eventId;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        venue: '',
        start_date: '',
        end_date: '',
        budget: '',
        poster: sampleBanners[0],
        status: 'upcoming',
        creator_instructions: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditMode && eventId) {
            fetchEventDetails();
        }
    }, [isEditMode, eventId]);

    const fetchEventDetails = async () => {
        try {
            const { data } = await api.get(`/events/detail.php?id=${eventId}`);
            if (data) {
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    venue: data.venue || '',
                    start_date: data.start_date || '',
                    end_date: data.end_date || '',
                    budget: data.budget?.toString() || '',
                    poster: data.poster || data.banner || sampleBanners[0],
                    status: data.status || 'upcoming',
                    creator_instructions: data.creator_instructions || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch event', error);
            toast.error('Failed to load event details');
            navigate(isAdmin ? '/admin/events' : '/creator/events');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size: 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('http://localhost/api/v1/upload/image.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, poster: data.url }));
                setSelectedBannerIndex(-1); // Deselect sample banners
                toast.success('Image uploaded successfully!');
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const selectBanner = (index: number) => {
        setSelectedBannerIndex(index);
        setFormData(prev => ({ ...prev, poster: sampleBanners[index] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.venue || !formData.start_date || !formData.end_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                budget: parseFloat(formData.budget) || 0,
                banner: formData.poster
            };

            if (isEditMode) {
                await api.put(`/events/detail.php?id=${eventId}`, payload);
                toast.success('Event updated successfully!');
            } else {
                await api.post('/events/index.php', payload);
                toast.success('Event created successfully!');
            }

            // Navigate to the appropriate events page
            if (isAdmin) {
                navigate('/admin/events');
            } else {
                navigate('/creator/events');
            }
        } catch (error: any) {
            console.error('Failed to create event', error);
            toast.error(error.response?.data?.error || 'Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const basePath = isAdmin ? '/admin' : '/creator';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Sidebar />

            <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                <Header />

                <main className="p-6 max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`${basePath}/events`)}
                        className="mb-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Button>

                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                            {isEditMode ? 'Edit Event' : 'Create New Event'}
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">
                            {isEditMode ? 'Update event details' : 'Fill in the details to create a new event'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Banner Selection */}
                        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
                            <Label className="text-[var(--text-primary)] text-lg font-semibold flex items-center gap-2 mb-4">
                                <Image className="w-5 h-5 text-indigo-400" />
                                Event Banner
                            </Label>

                            {/* Selected Banner Preview */}
                            <div className="relative rounded-xl overflow-hidden mb-4 aspect-[2/1]">
                                <img
                                    src={formData.poster}
                                    alt="Event Banner"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-4 text-white">
                                    <p className="text-sm text-white/70">Preview</p>
                                    <p className="text-xl font-bold">{formData.title || 'Your Event Title'}</p>
                                </div>
                            </div>

                            {/* Banner Thumbnails */}
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {sampleBanners.map((banner, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => selectBanner(index)}
                                        className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedBannerIndex === index
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                                            : 'border-transparent hover:border-white/20'
                                            }`}
                                    >
                                        <img src={banner} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>

                            {/* Upload Button */}
                            <div className="mt-4 flex items-center gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="banner-upload"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Image
                                        </>
                                    )}
                                </Button>
                                <span className="text-xs text-[var(--text-muted)]">Max 5MB • JPEG, PNG, GIF, WebP</span>
                            </div>

                            <div className="mt-4">
                                <Label className="text-[var(--text-secondary)] text-sm">Or enter custom URL</Label>
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.poster}
                                    onChange={(e) => handleChange('poster', e.target.value)}
                                    className="mt-2 bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
                                />
                            </div>
                        </div>

                        {/* Basic Details */}
                        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Event Details</h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)]">Event Title *</Label>
                                    <Input
                                        placeholder="Tech Conference 2026"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] text-lg"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)]">Description</Label>
                                    <Textarea
                                        placeholder="Describe your event in detail..."
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] min-h-[120px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)] flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Venue *
                                    </Label>
                                    <Input
                                        placeholder="Main Auditorium, Building A"
                                        value={formData.venue}
                                        onChange={(e) => handleChange('venue', e.target.value)}
                                        className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Instructions for Creators */}
                        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Instructions for Creators</h2>

                            <div className="space-y-2">
                                <Label className="text-[var(--text-secondary)]">Instructions / Requirements</Label>
                                <Textarea
                                    placeholder="Provide instructions for creators who want to apply to manage this event..."
                                    value={formData.creator_instructions}
                                    onChange={(e) => handleChange('creator_instructions', e.target.value)}
                                    className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] min-h-[100px]"
                                />
                                <p className="text-xs text-[var(--text-muted)]">
                                    Creators will see these instructions when browsing available events.
                                </p>
                            </div>
                        </div>

                        {/* Date & Budget */}
                        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Schedule & Budget</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)] flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Start Date & Time *
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={formData.start_date.split('T')[0]}
                                            onChange={(e) => {
                                                const date = e.target.value;
                                                const time = formData.start_date.split('T')[1] || '09:00';
                                                handleChange('start_date', `${date}T${time}`);
                                            }}
                                            className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] flex-1"
                                        />
                                        <Input
                                            type="time"
                                            value={formData.start_date.split('T')[1]}
                                            onChange={(e) => {
                                                const time = e.target.value;
                                                const date = formData.start_date.split('T')[0] || new Date().toISOString().split('T')[0];
                                                handleChange('start_date', `${date}T${time}`);
                                            }}
                                            className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] w-32"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)] flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        End Date & Time *
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={formData.end_date.split('T')[0]}
                                            onChange={(e) => {
                                                const date = e.target.value;
                                                const time = formData.end_date.split('T')[1] || '17:00';
                                                handleChange('end_date', `${date}T${time}`);
                                            }}
                                            className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] flex-1"
                                        />
                                        <Input
                                            type="time"
                                            value={formData.end_date.split('T')[1]}
                                            onChange={(e) => {
                                                const time = e.target.value;
                                                const date = formData.end_date.split('T')[0] || new Date().toISOString().split('T')[0];
                                                handleChange('end_date', `${date}T${time}`);
                                            }}
                                            className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] w-32"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)] flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Budget (₹)
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="50000"
                                        value={formData.budget}
                                        onChange={(e) => handleChange('budget', e.target.value)}
                                        className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[var(--text-secondary)]">Initial Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleChange('status', value)}
                                    >
                                        <SelectTrigger className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                            <SelectItem value="upcoming" className="text-[var(--text-primary)]">Upcoming</SelectItem>
                                            <SelectItem value="ongoing" className="text-[var(--text-primary)]">Ongoing</SelectItem>
                                            <SelectItem value="completed" className="text-[var(--text-primary)]">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`${basePath}/events`)}
                                className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-8"
                            >
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Event' : 'Create Event')}
                            </Button>
                        </div>
                    </form>
                </main>
            </div>
        </div >
    );
}
