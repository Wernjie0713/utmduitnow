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

            <div className="min-h-screen grid lg:grid-cols-5 gap-0 overflow-hidden bg-gray-50">
                {/* Left Column - Form */}
                <div className="flex flex-col py-12 px-8 lg:px-16 bg-white lg:col-span-3 overflow-y-auto max-h-screen">
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: shouldAnimate ? 0.3 : 0 }}
                        className="w-full max-w-xl mx-auto"
                    >
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Registration</h1>
                        <p className="text-gray-600 mb-8">Register your business unit to participate in the entrepreneurship challenge.</p>

                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* Business Info Section */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="business_name">Business Name <span className="text-red-500">*</span></InputLabel>
                                        <TextInput
                                            id="business_name"
                                            value={data.business_name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('business_name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.business_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="business_location">Business Location <span className="text-red-500">*</span></InputLabel>
                                        <select
                                            id="business_location"
                                            value={data.business_location}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            onChange={(e) => setData('business_location', e.target.value)}
                                            required
                                        >
                                            <option value="physical">Physical</option>
                                            <option value="online">Online</option>
                                        </select>
                                        <InputError message={errors.business_location} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="course_code">Course Code <span className="text-red-500">*</span></InputLabel>
                                            <TextInput
                                                id="course_code"
                                                value={data.course_code}
                                                className="mt-1 block w-full uppercase"
                                                placeholder="e.g. UHIT2302"
                                                onChange={(e) => setData('course_code', e.target.value.toUpperCase())}
                                                required
                                            />
                                            <InputError message={errors.course_code} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="section">Section <span className="text-red-500">*</span></InputLabel>
                                            <TextInput
                                                id="section"
                                                value={data.section}
                                                className="mt-1 block w-full"
                                                placeholder="e.g. 01"
                                                onChange={(e) => setData('section', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.section} className="mt-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Credentials Section */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Credentials (Shared)</h3>
                                <p className="text-sm text-gray-600 mb-4">These credentials will be shared among all team members to login to the business dashboard.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="email">Business Email <span className="text-red-500">*</span></InputLabel>
                                        <TextInput
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="password">Password <span className="text-red-500">*</span></InputLabel>
                                            <div className="relative">
                                                <TextInput
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={data.password}
                                                    className="mt-1 block w-full pr-10"
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <Eye className="h-5 w-5 text-gray-400" /> : <EyeOff className="h-5 w-5 text-gray-400" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></InputLabel>
                                            <div className="relative">
                                                <TextInput
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={data.password_confirmation}
                                                    className="mt-1 block w-full pr-10"
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <Eye className="h-5 w-5 text-gray-400" /> : <EyeOff className="h-5 w-5 text-gray-400" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password_confirmation} className="mt-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DuitNow IDs Section */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">DuitNow IDs</h3>
                                    <button type="button" onClick={addDuitnowId} className="text-sm flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
                                        <Plus className="w-4 h-4 mr-1"/> Add Another
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {data.duitnow_ids.map((id, index) => (
                                        <div key={index} className="flex gap-2">
                                            <div className="flex-grow">
                                                <TextInput
                                                    value={id}
                                                    onChange={(e) => updateDuitnowId(index, e.target.value)}
                                                    className="w-full"
                                                    placeholder="Enter DuitNow ID"
                                                    required
                                                />
                                                <InputError message={errors[`duitnow_ids.${index}`]} className="mt-2" />
                                            </div>
                                            {data.duitnow_ids.length > 1 && (
                                                <button type="button" onClick={() => removeDuitnowId(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <InputError message={errors.duitnow_ids} className="mt-2" />
                            </div>

                            {/* Team Members Section */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                                    <button type="button" onClick={addTeamMember} className="text-sm flex items-center text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded">
                                        <Plus className="w-4 h-4 mr-1"/> Add Member
                                    </button>
                                </div>
                                
                                {data.team_members.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic text-center py-4 bg-white rounded border border-dashed border-gray-300">No team members added yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {data.team_members.map((member, index) => (
                                            <div key={index} className="flex gap-2 p-3 bg-white border border-gray-200 rounded-lg relative items-start">
                                                <div className="grid grid-cols-2 gap-3 flex-grow">
                                                    <div>
                                                        <InputLabel className="text-xs text-gray-500" htmlFor={`name-${index}`}>Full Name <span className="text-red-500">*</span></InputLabel>
                                                        <TextInput
                                                            id={`name-${index}`}
                                                            value={member.name}
                                                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                                            className="w-full text-sm mt-1"
                                                            placeholder="Member Name"
                                                            required
                                                        />
                                                        <InputError message={errors[`team_members.${index}.name`]} className="mt-1" />
                                                    </div>
                                                    <div>
                                                        <InputLabel className="text-xs text-gray-500" htmlFor={`matric-${index}`}>Matric No. <span className="text-red-500">*</span></InputLabel>
                                                        <TextInput
                                                            id={`matric-${index}`}
                                                            value={member.matric_no}
                                                            onChange={(e) => updateTeamMember(index, 'matric_no', e.target.value)}
                                                            className="w-full text-sm uppercase mt-1"
                                                            placeholder="e.g. A22EC0000"
                                                            required
                                                        />
                                                        <InputError message={errors[`team_members.${index}.matric_no`]} className="mt-1" />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeTeamMember(index)} className="p-2 self-start mt-5 text-red-500 hover:bg-red-50 rounded-md" aria-label="Remove Team Member">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-end">
                                <Link
                                    href={`${route('login')}?from=register`}
                                    className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Already registered?
                                </Link>

                                <PrimaryButton className="ms-4" disabled={processing}>
                                    Register Business Unit
                                </PrimaryButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
                
                {/* Right Column - Store Illustration/Image */}
                <motion.div
                    className="hidden lg:flex items-center justify-center bg-gray-900 lg:col-span-2 relative overflow-hidden"
                    initial={showSwapAnimation ? "initial" : false}
                    animate="animate"
                    variants={rightColumnVariants}
                    transition={transition}
                >
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
                    <div className="w-full max-w-md p-12 relative z-10 text-white text-center">
                        <h2 className="text-3xl font-bold mb-4">Start Selling & Competing</h2>
                        <p className="text-gray-300">Join the UTM Entrepreneurship Challenge, record your direct sales efficiently with DuitNow, and rise to the top of the leaderboard.</p>
                        <div className="mt-12 opacity-80 backdrop-blur-sm bg-white/10 p-6 rounded-2xl border border-white/20">
                            <img src="/storage/images/logo-black-bg.jpg" className="w-24 h-24 mx-auto rounded-xl object-cover mix-blend-screen" alt="Wait"/>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
