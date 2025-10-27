import { useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneInput } from '@/Components/ui/phone-input';

export default function UpdateStudentInformationForm({ user, faculties, className = '' }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        phone_number: user.phone_number || '',
        matric_no: user.matric_no || '',
        faculty_id: user.faculty_id || '',
        year_of_study: user.year_of_study || '',
        duitnow_id: user.duitnow_id || '',
        password: '',
        password_confirmation: '',
    });

    // Show success toast when form is successfully submitted
    useEffect(() => {
        if (recentlySuccessful) {
            toast.success('Student information updated successfully!', {
                description: 'Your profile has been saved.',
                duration: 4000,
            });
        }
    }, [recentlySuccessful]);

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update.student'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Student Information
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your academic details and DuitNow ID.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Phone Number */}
                <div>
                    <InputLabel htmlFor="phone_number">
                        Phone Number <span className="text-red-500">*</span>
                    </InputLabel>
                    <PhoneInput
                        id="phone_number"
                        value={data.phone_number}
                        onChange={(value) => setData('phone_number', value)}
                        defaultCountry="MY"
                        placeholder="Enter phone number"
                        className="mt-1"
                        required
                    />
                    <InputError className="mt-2" message={errors.phone_number} />
                    <p className="mt-1 text-sm text-gray-600">
                        Required for account verification
                    </p>
                </div>

                <div>
                    <InputLabel htmlFor="matric_no">
                        Matric Number <span className="text-red-500">*</span>
                    </InputLabel>
                    <TextInput
                        id="matric_no"
                        className={`mt-1 block w-full ${user.matric_no ? 'bg-gray-100' : ''}`}
                        value={data.matric_no}
                        onChange={(e) => setData('matric_no', e.target.value.toUpperCase())}
                        disabled={!!user.matric_no}
                        required
                        autoComplete="matric_no"
                    />
                    <InputError className="mt-2" message={errors.matric_no} />
                    {user.matric_no && (
                        <p className="mt-2 text-sm text-gray-500">
                            Matric number cannot be changed after it has been set.
                        </p>
                    )}
                </div>

                <div>
                    <InputLabel htmlFor="faculty_id">
                        Faculty <span className="text-red-500">*</span>
                    </InputLabel>
                    <select
                        id="faculty_id"
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={data.faculty_id}
                        onChange={(e) => setData('faculty_id', e.target.value)}
                        required
                    >
                        <option value="">Select a faculty</option>
                        {faculties.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>
                                {faculty.full_name} ({faculty.short_name})
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-2" message={errors.faculty_id} />
                </div>

                <div>
                    <InputLabel htmlFor="year_of_study">
                        Year of Study <span className="text-red-500">*</span>
                    </InputLabel>
                    <select
                        id="year_of_study"
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={data.year_of_study}
                        onChange={(e) => setData('year_of_study', e.target.value)}
                        required
                    >
                        <option value="">Select year</option>
                        {[1, 2, 3, 4].map((year) => (
                            <option key={year} value={year}>
                                Year {year}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-2" message={errors.year_of_study} />
                </div>

                <div>
                    <InputLabel htmlFor="duitnow_id">
                        DuitNow ID <span className="text-red-500">*</span>
                    </InputLabel>
                    <TextInput
                        id="duitnow_id"
                        className={`mt-1 block w-full ${user.duitnow_id ? 'bg-gray-100' : ''}`}
                        value={data.duitnow_id}
                        onChange={(e) => setData('duitnow_id', e.target.value)}
                        disabled={!!user.duitnow_id}
                        required
                        autoComplete="duitnow_id"
                    />
                    <InputError className="mt-2" message={errors.duitnow_id} />
                    {user.duitnow_id && (
                        <p className="mt-2 text-sm text-gray-500">
                            DuitNow ID cannot be changed after it has been set.
                        </p>
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                        ⚠️ Warning: We will cross-check your DuitNow ID with submitted transactions.
                    </p>
                </div>

                {/* Password fields for OAuth users without password */}
                {!user.password && (
                    <>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="mb-4 rounded-md bg-blue-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Set a Password (Backup for Google Login)
                                        </h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>Set a password as backup in case you can't use Google login.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="password">
                                New Password <span className="text-red-500">*</span>
                            </InputLabel>
                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="mt-1 block w-full pr-10"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    autoComplete="new-password"
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
                            <InputError className="mt-2" message={errors.password} />
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation">
                                Confirm Password <span className="text-red-500">*</span>
                            </InputLabel>
                            <div className="relative">
                                <TextInput
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="mt-1 block w-full pr-10"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    autoComplete="new-password"
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
                            <InputError className="mt-2" message={errors.password_confirmation} />
                        </div>
                    </>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

