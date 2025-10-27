import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from '@/Components/ui/phone-input';
import { AnimatePresence, motion } from 'motion/react';

export default function Register({ faculties = [] }) {
    // Check URL parameter BEFORE first render
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const shouldAnimate = fromParam === 'login';
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showSwapAnimation] = useState(shouldAnimate);
    
    useEffect(() => {
        console.log('Register page - URL params:', window.location.search);
        console.log('Register page - from parameter:', fromParam);
        console.log('Register page - Should animate:', shouldAnimate);
        
        if (shouldAnimate) {
            console.log('Register page - Triggering swap animation from Login');
            
            // Clean up URL parameter AFTER animation completes (0.7s)
            setTimeout(() => {
                window.history.replaceState({}, '', route('register'));
                console.log('Register page - URL cleaned');
            }, 800); // Slightly longer than animation duration
        }
    }, []);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
        matric_no: '',
        faculty_id: '',
        year_of_study: '',
        duitnow_id: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Animation variants for reverse swap (from login)
    const rightColumnVariants = {
        initial: { x: '-150%' }, // Start from left position (Login's left column)
        animate: { x: 0 },        // Move to right position
    };

    const transition = {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1] // Cubic bezier for smooth easing
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen grid lg:grid-cols-5 gap-0 overflow-hidden">
                {/* Left Column - Animated Content */}
                <div className="flex flex-col justify-center px-8 lg:px-0 py-12 bg-white lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {!showForm ? (
                            <motion.div
                                key="initial"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className="max-w-md mx-auto w-full">
                                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                            Track Your Transactions, Compete & Win
                                        </h1>
                                        <p className="text-lg text-gray-600 mb-10">
                                            Join the UTM DuitNow transaction tracking competition. Record your payments, climb the leaderboard, and win exciting rewards.
                                        </p>
                                        
                                        {/* Google Button (Dark) */}
                                        <a
                                            href={route('auth.google')}
                                            className="w-full inline-flex justify-center items-center gap-3 rounded-lg bg-gray-900 px-6 py-2.5 text-base font-medium text-white shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                        >
                                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                            Sign up with Google
                                        </a>
                                        
                                        {/* Email Button (Outline) */}
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(true)}
                                            className="w-full mt-4 inline-flex justify-center items-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Sign up with Email
                                        </button>
                                        
                                        {/* Login Link */}
                                        <p className="mt-8 text-center text-sm text-gray-600">
                                            Already have an account?{' '}
                                            <Link 
                                                href={`${route('login')}?from=register`} 
                                                className="font-medium text-indigo-600 hover:text-indigo-500"
                                            >
                                                Log in
                                            </Link>
                                        </p>
                                    </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full max-w-md mx-auto"
                            >
                                {/* Back Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to sign up options
                                </button>

                                <form onSubmit={submit}>
                                    {/* Name + Email in one row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="name">
                                                Name <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <TextInput
                                                id="name"
                                                name="name"
                                                value={data.name}
                                                className="mt-1 block w-full"
                                                autoComplete="name"
                                                isFocused={true}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />

                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="email">
                                                Email <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <TextInput
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                className="mt-1 block w-full"
                                                autoComplete="username"
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />

                                            <InputError message={errors.email} className="mt-2" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <InputLabel htmlFor="phone_number">
                                            Phone Number <span className="text-red-500">*</span>
                                        </InputLabel>

                                        <PhoneInput
                                            id="phone_number"
                                            name="phone_number"
                                            value={data.phone_number}
                                            onChange={(value) => setData('phone_number', value)}
                                            defaultCountry="MY"
                                            placeholder="e.g. 123456789"
                                            className="mt-1"
                                            required
                                        />

                                        <InputError message={errors.phone_number} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-600">
                                            Required for account verification
                                        </p>
                                    </div>

                                    {/* Matric Number + DuitNow ID in one row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <InputLabel htmlFor="matric_no">
                                                Matric Number <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <TextInput
                                                id="matric_no"
                                                type="text"
                                                name="matric_no"
                                                value={data.matric_no}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('matric_no', e.target.value)}
                                                required
                                            />

                                            <InputError message={errors.matric_no} className="mt-2" />
                                            
                                            <p className="mt-1 text-xs text-amber-600 font-medium">
                                                ⚠️ Cannot be changed after registration
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="duitnow_id">
                                                DuitNow ID <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <TextInput
                                                id="duitnow_id"
                                                type="text"
                                                name="duitnow_id"
                                                value={data.duitnow_id}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('duitnow_id', e.target.value)}
                                                required
                                            />

                                            <InputError message={errors.duitnow_id} className="mt-2" />
                                            
                                            <p className="mt-1 text-xs text-amber-600 font-medium">
                                                ⚠️ Cannot be changed after registration
                                            </p>
                                        </div>
                                    </div>

                                    {/* Note about DuitNow ID verification */}
                                    <p className="mt-2 text-xs text-gray-600">
                                        Note: All submissions will be cross-checked against your registered DuitNow ID. Fraudulent submissions may result in disqualification.
                                    </p>

                                    {/* Faculty + Year of Study in one row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <InputLabel htmlFor="faculty_id">
                                                Faculty <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <select
                                                id="faculty_id"
                                                name="faculty_id"
                                                value={data.faculty_id}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                onChange={(e) => setData('faculty_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Faculty</option>
                                                {faculties.map((faculty) => (
                                                    <option key={faculty.id} value={faculty.id}>
                                                        {faculty.full_name} ({faculty.short_name})
                                                    </option>
                                                ))}
                                            </select>

                                            <InputError message={errors.faculty_id} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="year_of_study">
                                                Year of Study <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <select
                                                id="year_of_study"
                                                name="year_of_study"
                                                value={data.year_of_study}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                onChange={(e) => setData('year_of_study', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Year</option>
                                                <option value="1">Year 1</option>
                                                <option value="2">Year 2</option>
                                                <option value="3">Year 3</option>
                                                <option value="4">Year 4</option>
                                            </select>

                                            <InputError message={errors.year_of_study} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Password + Confirm Password in one row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <InputLabel htmlFor="password">
                                                Password <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <div className="relative">
                                                <TextInput
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={data.password}
                                                    className="mt-1 block w-full pr-10"
                                                    autoComplete="new-password"
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    ) : (
                                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    )}
                                                </button>
                                            </div>

                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="password_confirmation">
                                                Confirm Password <span className="text-red-500">*</span>
                                            </InputLabel>

                                            <div className="relative">
                                                <TextInput
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="password_confirmation"
                                                    value={data.password_confirmation}
                                                    className="mt-1 block w-full pr-10"
                                                    autoComplete="new-password"
                                                    onChange={(e) =>
                                                        setData('password_confirmation', e.target.value)
                                                    }
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? (
                                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    ) : (
                                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    )}
                                                </button>
                                            </div>

                                            <InputError
                                                message={errors.password_confirmation}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end">
                                        <Link
                                            href={`${route('login')}?from=register`}
                                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            Already registered?
                                        </Link>

                                        <PrimaryButton className="ms-4" disabled={processing}>
                                            Register
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
