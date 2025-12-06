'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send, Loader2, Clock, CheckCircle } from 'lucide-react';
import { images } from '../../assets/images';
import MotionWrapper from '../components/MotionWrapper';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        email: 'info@rotaractsusl.org',
        phone: '+94 71 123 4567', // Default placeholder
        address: 'Sabaragamuwa University of Sri Lanka, Belihuloya'
    });
    const [socialLinks, setSocialLinks] = useState({
        facebookUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        tiktokUrl: "",
        youtubeUrl: ""
    });

    useEffect(() => {
        // Fetch contact info from API (Server-side fallback to old settings)
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/public');
                if (res.ok) {
                    const data = await res.json();
                    setContactInfo(prev => ({
                        ...prev,
                        email: data.contactEmail || prev.email,
                        phone: data.whatsappPhone || prev.phone,
                    }));
                    setSocialLinks({
                        facebookUrl: data.facebookUrl || "",
                        instagramUrl: data.instagramUrl || "",
                        linkedinUrl: data.linkedinUrl || "",
                        tiktokUrl: data.tiktokUrl || "",
                        youtubeUrl: data.youtubeUrl || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: 'contact_us',
                    to: contactInfo.email, // Send TO the admin email
                    replyTo: formData.email, // Reply to the user
                    data: {
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message
                    }
                })
            });

            if (res.ok) {
                setSuccess(true);
                setFormData({ name: '', email: '', subject: '', message: '' });
                setTimeout(() => setSuccess(false), 5000);
            } else {
                alert('Failed to send message. Please try again later.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar currentPage="contact" />

            {/* Hero Header - Matching Other Pages */}
            <section className="px-4 py-8 lg:py-12 pt-4 lg:pt-8">
                <MotionWrapper className="max-w-[1440px] mx-auto px-8">
                    <div className="rounded-[43px] overflow-hidden relative h-[280px] md:h-[339px]">
                        <img src={images.imgRectangle15} alt="Contact Us" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="font-playfair font-medium text-3xl md:text-[47px] text-white mb-4 leading-tight">
                                Get in <span className="text-pink-600">Touch</span>
                            </h1>
                            <p className="font-poppins font-medium text-sm md:text-base text-white max-w-2xl leading-relaxed">
                                Have questions or want to collaborate? We'd love to hear from you. Connect with us to learn more about our initiatives.
                            </p>
                        </div>
                    </div>
                </MotionWrapper>
            </section>

            <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

                    {/* Contact Info Sidebar */}
                    <MotionWrapper
                        className="lg:col-span-1 flex flex-col gap-6 h-full"
                        variant="fadeInLeft"
                        delay={0.2}
                    >
                        {/* Email */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-playfair font-bold text-lg text-gray-900 mb-1">Email Us</h3>
                                <p className="font-poppins text-sm text-gray-600 mb-2">For general inquiries</p>
                                <a href={`mailto:${contactInfo.email}`} className="text-pink-600 font-medium hover:underline break-all">
                                    {contactInfo.email}
                                </a>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
                            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-playfair font-bold text-lg text-gray-900 mb-1">Visit Us</h3>
                                <p className="font-poppins text-sm text-gray-800 font-semibold mb-1">
                                    Rotaract Club of Sabaragamuwa University of Sri Lanka
                                </p>
                                <p className="font-poppins text-sm text-gray-600">
                                    Sabaragamuwa University of Sri Lanka,<br />
                                    P.O. Box 02, Belihuloya,<br />
                                    70140, Sri Lanka.
                                </p>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
                            <div className="bg-pink-50 p-3 rounded-xl text-pink-600">
                                <Send size={24} />
                            </div>
                            <div>
                                <h3 className="font-playfair font-bold text-lg text-gray-900 mb-2">Follow Us</h3>
                                <div className="flex gap-4 flex-wrap">
                                    {socialLinks.facebookUrl && (
                                        <a href={socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" title="Facebook">
                                            <img src={images.imgIcons8Fb481} alt="Facebook" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                                        </a>
                                    )}
                                    {socialLinks.instagramUrl && (
                                        <a href={socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram">
                                            <img src={images.imgIcons8Insta641} alt="Instagram" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                                        </a>
                                    )}
                                    {socialLinks.linkedinUrl && (
                                        <a href={socialLinks.linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                                            <img src={images.imgIcons8LinkedIn501} alt="LinkedIn" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                                        </a>
                                    )}
                                    {socialLinks.tiktokUrl && (
                                        <a href={socialLinks.tiktokUrl} target="_blank" rel="noopener noreferrer" title="TikTok">
                                            <img src={images.imgIcons8Tiktok501} alt="TikTok" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                                        </a>
                                    )}
                                    {socialLinks.youtubeUrl && (
                                        <a href={socialLinks.youtubeUrl} target="_blank" rel="noopener noreferrer" title="YouTube">
                                            <img src={images.imgIcons8Youtube501} alt="YouTube" className="w-8 h-8 cursor-pointer hover:opacity-80" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Map - Fills remaining space */}
                        <div className="w-full bg-gray-200 relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-1 min-h-[250px]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.7984671282624!2d80.78719671477285!3d6.713104995147055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae38a0000000001%3A0x1c04c473337032!2sSabaragamuwa%20University%20of%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1635747654321!5m2!1sen!2slk"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                className="grayscale hover:grayscale-0 transition-all duration-500 absolute inset-0"
                            ></iframe>
                        </div>
                    </MotionWrapper>

                    {/* Contact Form */}
                    <MotionWrapper
                        className="lg:col-span-2 flex flex-col h-full"
                        variant="fadeInRight"
                        delay={0.4}
                    >
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10 h-full flex flex-col justify-center">
                            <h2 className="font-playfair font-bold text-3xl text-gray-900 mb-6">Send a Message</h2>

                            {success ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="font-playfair font-bold text-2xl text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="font-poppins text-gray-600">
                                        Thank you for reaching out. We will get back to you as soon as possible.
                                    </p>
                                    <button
                                        onClick={() => setSuccess(false)}
                                        className="mt-6 text-pink-600 font-semibold hover:underline"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block font-poppins font-medium text-gray-700 mb-2">Your Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none font-poppins"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block font-poppins font-medium text-gray-700 mb-2">Your Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="john@example.com"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none font-poppins"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block font-poppins font-medium text-gray-700 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            required
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="How can we help?"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none font-poppins"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block font-poppins font-medium text-gray-700 mb-2">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Write your message here..."
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none font-poppins resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl hover:bg-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={20} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </MotionWrapper>
                </div>
            </div>

            <Footer />
        </div>
    );
}
