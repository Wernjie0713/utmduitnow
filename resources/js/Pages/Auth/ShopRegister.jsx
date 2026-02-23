import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function ShopRegister() {
    // Check URL parameter BEFORE first render
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const shouldAnimate = fromParam === 'login';
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSwapAnimation] = useState(shouldAnimate);
    
    useEffect(() => {
        if (shouldAnimate) {
            setTimeout(() => {
                window.history.replaceState({}, '', route('shop.register'));
            }, 800);
        }
    }, [shouldAnimate]);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        business_name: '',
        business_location: 'physical',
        course_code: '',
        section: '',
        email: '',
        password: '',
        password_confirmation: '',
        team_members: [], // Optional
        duitnow_ids: [''],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('shop.register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const addTeamMember = () => {
        setData('team_members', [...data.team_members, { name: '', matric_no: '' }]);
    };

    const removeTeamMember = (index) => {
        const newMembers = [...data.team_members];
        newMembers.splice(index, 1);
        setData('team_members', newMembers);
    };

    const updateTeamMember = (index, field, value) => {
        const newMembers = [...data.team_members];
        newMembers[index][field] = value;
        setData('team_members', newMembers);
    };

    const addDuitnowId = () => {
        setData('duitnow_ids', [...data.duitnow_ids, '']);
    };

    const removeDuitnowId = (index) => {
        if (data.duitnow_ids.length > 1) {
            const newIds = [...data.duitnow_ids];
            newIds.splice(index, 1);
            setData('duitnow_ids', newIds);
        }
    };

    const updateDuitnowId = (index, value) => {
        const newIds = [...data.duitnow_ids];
        newIds[index] = value;
        setData('duitnow_ids', newIds);
    };

    const rightColumnVariants = {
        initial: { x: '-150%' },
        animate: { x: 0 },
    };

    const transition = {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1]
    };

    return (
        <>
            <Head title="Business Unit Registration" />

            <div className="min-h-screen grid lg:grid-cols-5 gap-0 overflow-hidden">
                {/* Left Column - Form */}
                <div className="flex flex-col justify-center px-8 lg:px-0 py-12 bg-white lg:col-span-3">
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: shouldAnimate ? 0.3 : 0 }}
                        className="w-full"
                    >
                        <div className="max-w-md mx-auto w-full">
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">Business Registration</h1>
                            <p className="text-lg text-gray-600 mb-10">Register your business unit to participate in the entrepreneurship challenge.</p>

                        <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">Registration Closed</h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>The event has ended and no new business unit registrations are allowed. Existing business units can still log in using their credentials.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex">
                            <Link
                                href={`${route('login')}?from=register`}
                                className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                            >
                                Go to Login Page
                            </Link>
                        </div>
                        </div>
                    </motion.div>
                </div>
                
                {/* Right Column - Full Black Background with Logo (Animated) */}
                <motion.div
                    className="hidden lg:flex items-center justify-center bg-black lg:col-span-2"
                    initial={showSwapAnimation ? "initial" : false}
                    animate="animate"
                    variants={rightColumnVariants}
                    transition={transition}
                >
                    <div className="w-full max-w-md p-12">
                        {/* UTM Logo */}
                        <img 
                            src="/storage/images/logo-black-bg.jpg" 
                            alt="UTM Logo" 
                            className="w-full h-auto"
                        />
                    </div>
                </motion.div>
            </div>
        </>
    );
}
