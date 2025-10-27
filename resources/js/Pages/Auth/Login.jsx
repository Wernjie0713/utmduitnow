import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ status, canResetPassword }) {
    // Check URL parameter BEFORE first render
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const shouldAnimate = fromParam === 'register';
    
    const [showPassword, setShowPassword] = useState(false);
    const [showSwapAnimation] = useState(shouldAnimate);
    
    useEffect(() => {
        console.log('Login page - URL params:', window.location.search);
        console.log('Login page - from parameter:', fromParam);
        console.log('Login page - Should animate:', shouldAnimate);
        
        if (shouldAnimate) {
            console.log('Login page - Triggering swap animation from Register');
            
            // Clean up URL parameter AFTER animation completes (0.7s)
            setTimeout(() => {
                window.history.replaceState({}, '', route('login'));
                console.log('Login page - URL cleaned');
            }, 800); // Slightly longer than animation duration
        }
    }, []);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Animation variants
    const leftColumnVariants = {
        initial: { x: '200%' }, // Start from far right (Register's right column position)
        animate: { x: 0 },       // Move to left position
    };

    const transition = {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1] // Cubic bezier for smooth easing
    };

    return (
        <>
            <Head title="Log in" />

            <div className="min-h-screen grid lg:grid-cols-5 gap-0 overflow-hidden">
                {/* Left Column - Black Background with Logo (Animated) */}
                <motion.div
                    className="hidden lg:flex items-center justify-center bg-black lg:col-span-2"
                    initial={showSwapAnimation ? "initial" : false}
                    animate="animate"
                    variants={leftColumnVariants}
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

                {/* Right Column - Login Form (Static) */}
                <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-white lg:col-span-3">
                    <div className="max-w-md mx-auto w-full">
                        {/* Welcome Title */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-lg text-gray-600">
                                Welcome back! Select method to login
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        {/* Google OAuth Button */}
                        <div className="mb-6">
                            <a
                                href={route('auth.google')}
                                className="w-full inline-flex justify-center items-center gap-3 rounded-lg bg-white border border-gray-300 px-6 py-2.5 text-base font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Login with Google
                            </a>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit}>
                            <div>
                                <InputLabel htmlFor="email" value="Email" />

                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />

                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="password" value="Password" />

                                <div className="relative">
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full pr-10"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
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

                            <div className="mt-4 block">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', e.target.checked)
                                        }
                                    />
                                    <span className="ms-2 text-sm text-gray-600">
                                        Remember me
                                    </span>
                                </label>
                            </div>

                            <div className="mt-4 flex items-center justify-end">
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Forgot your password?
                                    </Link>
                                )}

                                <PrimaryButton className="ms-4" disabled={processing}>
                                    Log in
                                </PrimaryButton>
                            </div>
                        </form>

                        {/* Sign up link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link 
                                    href={`${route('register')}?from=login`} 
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
