import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Brain, 
    Trophy, 
    BarChart3, 
    Gift, 
    Smartphone, 
    Shield,
    UserPlus,
    ClipboardCheck,
    Upload,
    CheckCircle2,
    Award,
    Instagram
} from 'lucide-react';
import { FireworksBackground } from '@/Components/animate-ui/components/backgrounds/fireworks';
import StaggeredMenu from '@/Components/StaggeredMenu';
import { Timeline } from '@/Components/ui/timeline';
import { AnimatedTestimonials } from '@/Components/ui/animated-testimonials';
import { InfiniteMovingCards } from '@/Components/ui/infinite-moving-cards';
import { HoverEffect } from '@/Components/ui/card-hover-effect';
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from '@/Components/animate-ui/components/base/accordion';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function Welcome({ auth }) {
    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    // Smooth scroll utility
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Handle menu link clicks with smooth scroll
    const handleMenuLinkClick = (e, link) => {
        if (link.startsWith('#')) {
            e.preventDefault();
            const sectionId = link.substring(1);
            scrollToSection(sectionId);
            return true; // Signal to close menu
        }
        return false;
    };

    // Navigation items for StaggeredMenu
    const menuItems = [
        { label: 'Home', ariaLabel: 'Go to home', link: '#home' },
        { label: 'Features', ariaLabel: 'View features', link: '#features' },
        { label: 'How It Works', ariaLabel: 'Learn how it works', link: '#how-it-works' },
        { label: 'Winners', ariaLabel: 'View winners', link: '#winners' },
        { label: 'Statistics', ariaLabel: 'View statistics', link: '#statistics' },
        { label: 'FAQ', ariaLabel: 'Frequently asked questions', link: '#faq' },
    ];

    // Social media links
    const socialItems = [
        { label: 'Instagram', link: 'https://www.instagram.com/duitnow_utm/' },
    ];

    // Features data
    const features = [
        {
            title: 'AI-Powered Receipt Scanning',
            description: 'Automatic extraction with Azure OCR technology. Upload your receipt and let our AI do the rest.',
            icon: <Brain className="h-6 w-6 text-blue-500" />,
        },
        {
            title: 'Real-time Leaderboard',
            description: 'See your ranking updated instantly. Track your progress and compete with other students.',
            icon: <Trophy className="h-6 w-6 text-yellow-500" />,
        },
        {
            title: 'Track Your Progress',
            description: 'Monitor all your transactions in one place. View detailed history and statistics.',
            icon: <BarChart3 className="h-6 w-6 text-green-500" />,
        },
        {
            title: 'Exciting Rewards',
            description: 'Win prizes for top performers. Cash rewards, certificates, and more await you.',
            icon: <Gift className="h-6 w-6 text-purple-500" />,
        },
        {
            title: 'Mobile Friendly',
            description: 'Submit receipts anytime, anywhere. Optimized for mobile devices.',
            icon: <Smartphone className="h-6 w-6 text-orange-500" />,
        },
        {
            title: 'Secure & Verified',
            description: 'DuitNow ID verification ensures fair competition. All transactions are securely stored.',
            icon: <Shield className="h-6 w-6 text-red-500" />,
        },
    ];

    // Timeline data for How It Works
    const timelineData = [
        {
            title: 'Register',
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-gray-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="text-lg font-semibold">Register with Student Email</h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                        Create your account using your UTM student email. Quick and easy registration process.
                    </p>
                </div>
            ),
        },
        {
            title: 'Profile',
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                            <ClipboardCheck className="h-6 w-6 text-gray-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="text-lg font-semibold">Complete Your Profile</h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                        Add your matric number, DuitNow ID, faculty, and year of study to complete your profile.
                    </p>
                </div>
            ),
        },
        {
            title: 'Upload',
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Upload className="h-6 w-6 text-gray-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="text-lg font-semibold">Upload DuitNow Receipts</h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                        Submit transaction proof via receipt photo. Capture clear images for best results.
                    </p>
                </div>
            ),
        },
        {
            title: 'Verify',
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-gray-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="text-lg font-semibold">AI Verifies Transactions</h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                        Automatic verification using Azure OCR. Your leaderboard ranking updates instantly upon approval.
                    </p>
                </div>
            ),
        },
        {
            title: 'Win',
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Award className="h-6 w-6 text-gray-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="text-lg font-semibold">Win Rewards</h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                        Top performers receive exciting prizes, certificates, and recognition at the award ceremony.
                    </p>
                </div>
            ),
        },
    ];

    // Winner testimonials
    const testimonials = [
        {
            name: 'Lee Xing Jue',
            designation: 'School of Professional and Continuing Education - 1st Place Winner',
            quote: 'Winning this competition was amazing! The AI-powered system made it so easy to track my transactions, and the rewards motivated me to stay organized with my finances.',
            src: 'https://api.dicebear.com/9.x/notionists/svg?seed=LeeXingJue',
        },
        {
            name: 'Tan Kher Xuan',
            designation: 'Faculty of Science - 2nd Place Winner',
            quote: 'I never thought tracking my DuitNow transactions could be this fun! The leaderboard feature kept me engaged throughout the competition.',
            src: 'https://api.dicebear.com/9.x/notionists/svg?seed=TanKherXuan',
        },
        {
            name: 'Chan Zi Jian',
            designation: 'Faculty of Science - 3rd Place Winner',
            quote: 'The competition helped me develop better financial habits. Plus, winning a prize was the cherry on top!',
            src: 'https://api.dicebear.com/9.x/notionists/svg?seed=ChanZiJian',
        },
        {
            name: 'Muhamad Idham bin Mohamad Razali',
            designation: 'Faculty of Computing - Top 10 Winner',
            quote: 'As a computing student, I appreciated how the system leveraged AI technology. It made tracking transactions seamless and efficient.',
            src: 'https://api.dicebear.com/9.x/notionists/svg?seed=MuhamadIdham',
        },
        {
            name: 'Dayang Farah Farzana binti Abang Idham',
            designation: 'Faculty of Computing - Top 10 Winner',
            quote: 'This competition helped me understand digital payments better. The user-friendly interface made it easy to participate and compete.',
            src: 'https://api.dicebear.com/9.x/notionists/svg?seed=DayangFarah',
        },
        {
            name: 'Nur Firzana binti Badrus Hisham',
            designation: 'Faculty of Computing - Top 10 Winner',
            quote: 'Participating in this competition was a great experience! The real-time leaderboard kept me motivated to track all my transactions.',
            src: 'https://api.dicebear.com/9.x/notionists/svg?seed=NurFirzana',
        },
    ];

    // Award ceremony photos for infinite scroll
    const awardCeremonyPhotos = [
        {
            src: "/storage/images/Student 5.png",
            alt: "Winner receiving award at ceremony"
        },
        {
            src: "/storage/images/Student 7.png",
            alt: "Winner with certificate"
        },
        {
            src: "/storage/images/Student 10.png",
            alt: "Award ceremony moment"
        },
        {
            src: "/storage/images/Student 11.png",
            alt: "Winner celebration"
        },
        {
            src: "/storage/images/Student 12.png",
            alt: "Award presentation"
        },
        {
            src: "/storage/images/Student 17.png",
            alt: "Winner group photo"
        },
    ];

    // Statistics data
    const statistics = [
        {
            title: 'Total Participants',
            description: '250+ Students joined last year and competed for exciting prizes',
        },
        {
            title: 'Transactions Recorded',
            description: '10,000+ Verified transactions submitted throughout the competition',
        },  
        {
            title: 'Prizes Distributed',
            description: 'RM2,000+ In total rewards given to top performing students',
        },
        {
            title: 'Highest Record',
            description: '159 Transactions by the champion winner of last year',
        },
    ];

    // FAQ data
    const faqData = [
        {
            question: 'How do I participate in the competition?',
            answer: 'Register with your UTM student email, complete your profile with matric number and DuitNow ID, and start submitting transaction receipts. It\'s that simple!',
        },
        {
            question: 'What transactions are eligible for submission?',
            answer: 'All DuitNow transactions with valid receipts showing transaction ID, amount, date, and recipient details are eligible. Make sure your receipts are clear and readable.',
        },
        {
            question: 'How does the AI verification work?',
            answer: 'Our Azure AI OCR technology automatically extracts transaction details from your receipt photo and cross-verifies with your registered DuitNow ID. The process takes just seconds!',
        },
        {
            question: 'How is the winner determined?',
            answer: 'Winners are determined by the highest number of verified transactions within the competition period. Rankings are updated in real-time on the leaderboard.',
        },
        {
            question: 'What prizes can I win?',
            answer: 'Top performers receive prizes, certificates, and recognition. Prize distribution is announced at the end of each competition period. Last year, we distributed over RM2,000 in prizes!',
        },
        {
            question: 'Can I edit or delete submitted transactions?',
            answer: 'You can view all your submitted transactions in the My Transactions page. For corrections or disputes, please contact the admin team for assistance.',
        },
        {
            question: 'How often is the leaderboard updated?',
            answer: 'The leaderboard updates instantly after each transaction is verified and approved by the system. You can track your progress in real-time!',
        },
        {
            question: 'What if my receipt is rejected?',
            answer: 'If rejected, you\'ll receive a notification with the reason. Common reasons include unclear images or missing information. You can resubmit with a clearer receipt or contact support for help.',
        },
    ];

    return (
        <>
            <Head title="UTM DuitNow Competition" />
            
            {/* Staggered Menu Navigation */}
            <StaggeredMenu
                position="right"
                items={menuItems}
                socialItems={socialItems}
                displaySocials={true}
                displayItemNumbering={true}
                menuButtonColor="#000000"
                openMenuButtonColor="#ffffff"
                changeMenuColorOnOpen={true}
                colors={['#3b82f6', '#8b5cf6']}
                logoUrl="/storage/images/logo.png"
                accentColor="#3b82f6"
                isFixed={true}
                onLinkClick={handleMenuLinkClick}
                showAuthButton={true}
                authUser={auth.user}
            />

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-white">
                <FireworksBackground 
                    className="absolute inset-0 flex items-center justify-center"
                    color="black"
                    population={0.5}
                    fireworkSpeed={{ min: 2, max: 10 }}
                    particleSpeed={{ min: 1, max: 6 }}
                />
                <motion.div 
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    style={{ pointerEvents: 'auto' }}
                >
                    <motion.h1 
                        className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
                        variants={fadeInUp}
                    >
                        Track Your Transactions, <br />
                        <span className="text-blue-600">Compete & Win</span>
                    </motion.h1>
                    <motion.p 
                        className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto"
                        variants={fadeInUp}
                    >
                        Join the UTM DuitNow transaction tracking competition. Record your payments, climb the leaderboard, and win exciting rewards.
                    </motion.p>
                    <motion.div 
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        variants={fadeInUp}
                        style={{ pointerEvents: 'auto' }}
                    >
                                {auth.user ? (
                            <Link href={route('dashboard')}>
                                <Button size="lg" className="text-lg px-8 py-6">
                                    Go to Dashboard
                                </Button>
                                    </Link>
                                ) : (
                                    <>
                                <Button 
                                    size="lg" 
                                    className="text-lg px-8 py-6"
                                    onClick={() => scrollToSection('features')}
                                >
                                    Get Started
                                </Button>
                                <Link href={route('register')}>
                                    <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                                        Register Now
                                    </Button>
                                        </Link>
                                    </>
                                )}
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Everything you need to track transactions and compete effectively
                        </p>
                    </motion.div>
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        style={{ pointerEvents: 'auto' }}
                    >
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-950"
                                style={{ pointerEvents: 'auto' }}
                            >
                                {/* Gradient Background Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-blue-950/20" />
                                
                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Icon with background */}
                                    <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-blue-950/50 dark:to-purple-950/50">
                                        {React.cloneElement(feature.icon, { 
                                            className: "h-8 w-8"
                                        })}
                                    </div>

                                    {/* Title */}
                                    <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                                        {feature.title}
                                    </h3>
                                    
                                    {/* Description */}
                                    <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                    
                                    {/* Decorative corner accent */}
                                    <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20 dark:from-blue-900 dark:to-purple-900" />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                                            </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="bg-white dark:bg-black py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        className="text-center mb-12"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            How It Works
                                                </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Five simple steps to start competing and winning
                                                </p>
                                            </motion.div>
                                        </div>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeIn}
                    style={{ pointerEvents: 'auto' }}
                >
                    <Timeline data={timelineData} />
                </motion.div>
            </section>

            {/* Award Ceremony Photos Section */}
            <section className="py-16 bg-gray-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        className="text-center mb-12"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Award Ceremony Highlights
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Moments captured from our prestigious award ceremony
                        </p>
                    </motion.div>
                </div>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeIn}
                    style={{ pointerEvents: 'auto' }}
                >
                    <InfiniteMovingCards
                        items={awardCeremonyPhotos}
                        direction="left"
                        speed="slow"
                        pauseOnHover={true}
                    />
                </motion.div>
            </section>

            {/* Winners Showcase Section */}
            <section id="winners" className="py-20 bg-white dark:bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Last Year's Champions
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Meet our previous winners and hear their success stories
                        </p>
                                    </motion.div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeIn}
                        style={{ pointerEvents: 'auto' }}
                    >
                        <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
                    </motion.div>
                                    </div>
            </section>

            {/* Statistics Section */}
            <section id="statistics" className="py-20 bg-gray-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Competition Highlights
                                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Impressive numbers from last year's competition
                                        </p>
                                    </motion.div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeIn}
                        style={{ pointerEvents: 'auto' }}
                    >
                        <HoverEffect items={statistics} className="lg:grid-cols-4" />
                    </motion.div>
                                    </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 bg-white dark:bg-black">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Frequently Asked Questions
                                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Everything you need to know about the competition
                                        </p>
                                    </motion.div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        style={{ pointerEvents: 'auto' }}
                    >
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqData.map((faq, index) => (
                                <motion.div key={index} variants={fadeInUp} style={{ pointerEvents: 'auto' }}>
                                    <AccordionItem value={`item-${index}`}>
                                        <AccordionTrigger className="text-left text-lg font-semibold">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionPanel className="text-gray-600 dark:text-gray-300">
                                            {faq.answer}
                                        </AccordionPanel>
                                    </AccordionItem>
                                </motion.div>
                            ))}
                        </Accordion>
                    </motion.div>
                                    </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white pt-16 pb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 max-w-4xl mx-auto">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-semibold mb-4">UTM DuitNow Competition</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Empowering students to track transactions and compete for exciting rewards.
                            </p>
                                    </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-3 text-gray-400">
                                <li>
                                    <a 
                                        href="#features" 
                                        onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
                                        className="hover:text-white transition-colors inline-flex items-center cursor-pointer"
                                    >
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="#how-it-works" 
                                        onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
                                        className="hover:text-white transition-colors inline-flex items-center cursor-pointer"
                                    >
                                        How It Works
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="#winners" 
                                        onClick={(e) => { e.preventDefault(); scrollToSection('winners'); }}
                                        className="hover:text-white transition-colors inline-flex items-center cursor-pointer"
                                    >
                                        Winners
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="#faq" 
                                        onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}
                                        className="hover:text-white transition-colors inline-flex items-center cursor-pointer"
                                    >
                                        FAQ
                                    </a>
                                </li>
                            </ul>
                                    </div>
                                </div>
                    <div className="border-t border-gray-800 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-gray-400 text-sm">
                                &copy; 2025 UTM DuitNow Competition. All rights reserved.
                            </p>
                            <a 
                                href="https://www.instagram.com/duitnow_utm/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <Instagram className="h-5 w-5" />
                                <span className="text-sm">@duitnow_utm</span>
                            </a>
                            </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
