import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateAvatarForm from './Partials/UpdateAvatarForm';
import UpdateStudentInformationForm from './Partials/UpdateStudentInformationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { useState, useEffect } from 'react';

export default function Edit({ auth, mustVerifyEmail, status, faculties }) {
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    useEffect(() => {
        // Show welcome modal for Google OAuth users with incomplete profile
        // Based on profile_completed flag, not sessionStorage
        if (auth.user?.google_id && !auth.user?.profile_completed) {
            setShowWelcomeModal(true);
        } else {
            setShowWelcomeModal(false);
        }
    }, [auth.user?.google_id, auth.user?.profile_completed]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            {/* Welcome Modal for Google OAuth Users */}
            <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Welcome! Complete Your Profile
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            You've successfully signed in with Google! To access your dashboard and start using the platform, please complete the following required fields:
                        </p>
                        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                            <h4 className="font-medium text-sm text-gray-900">Required Information:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                <li>Phone Number</li>
                                <li>Matric Number</li>
                                <li>Faculty</li>
                                <li>Year of Study</li>
                                <li>DuitNow ID</li>
                                <li>Password (as backup for Google login)</li>
                            </ul>
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Note:</span> You won't be able to navigate to other pages until your profile is complete.
                        </p>
                        <button
                            onClick={() => setShowWelcomeModal(false)}
                            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Got it, let's complete my profile
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-6 sm:px-6 md:px-6 lg:px-8">
                    {auth.user.needsProfileCompletion && (
                        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">Profile Incomplete</h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>Please complete all required fields below to access your dashboard.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateAvatarForm 
                            user={auth.user} 
                            className="max-w-xl" 
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateStudentInformationForm 
                            user={auth.user}
                            faculties={faculties}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    {/* Hide password section if user has no password (OAuth users) */}
                    {auth.user.password && (
                        <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                            <UpdatePasswordForm user={auth.user} className="max-w-xl" />
                        </div>
                    )}

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
