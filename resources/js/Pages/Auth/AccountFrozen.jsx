import { Head, Link, router } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { AlertCircle, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

export default function AccountFrozen() {
    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    return (
        <GuestLayout>
            <Head title="Account Frozen" />

            <div className="flex items-center justify-center bg-gray-50 px-4 py-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-red-100 p-4">
                                <AlertCircle className="h-12 w-12 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Account Frozen</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Your account has been frozen due to suspicious activity or violation of competition rules.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">
                                You are no longer able to participate in the competition. If you believe this is an error, please contact the administrator.
                            </p>
                        </div>
                        
                        <div className="pt-4">
                            <Button
                                onClick={handleLogout}
                                className="w-full bg-black hover:bg-gray-800 text-white"
                                size="lg"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Log Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </GuestLayout>
    );
}



