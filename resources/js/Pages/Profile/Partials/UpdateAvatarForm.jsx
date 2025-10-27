import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import UserAvatar from '@/Components/UserAvatar';
import { toast } from 'sonner';

export default function UpdateAvatarForm({ user, className = '' }) {
    const [preview, setPreview] = useState(user.avatar);
    const { data, setData, post, processing, errors, reset } = useForm({
        avatar: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                toast.success('Profile picture updated successfully!');
            },
        });
    };

    const removeAvatar = () => {
        if (confirm('Are you sure you want to remove your profile picture?')) {
            router.delete(route('profile.avatar.destroy'), {
                onSuccess: () => {
                    setPreview(null);
                    reset();
                    toast.success('Profile picture removed successfully!');
                },
            });
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Picture
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile picture.
                </p>
            </header>

            <div className="mt-6 flex items-center gap-6">
                {preview ? (
                    <img 
                        src={preview} 
                        alt={user.name}
                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                    />
                ) : (
                    <div className="border-2 border-gray-200 rounded-full">
                        <UserAvatar 
                            user={user}
                            className="h-24 w-24"
                        />
                    </div>
                )}
                
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-upload"
                    />
                    <SecondaryButton 
                        type="button"
                        onClick={() => document.getElementById('avatar-upload').click()}
                    >
                        Choose Photo
                    </SecondaryButton>
                    
                    {user.avatar_url && (
                        <SecondaryButton onClick={removeAvatar} type="button">
                            Remove Photo
                        </SecondaryButton>
                    )}

                    <p className="text-xs text-gray-500">
                        JPG, PNG, GIF up to 5MB
                    </p>
                </div>
            </div>

            {errors.avatar && <InputError message={errors.avatar} className="mt-2" />}

            {data.avatar && (
                <div className="mt-4">
                    <PrimaryButton onClick={submit} disabled={processing}>
                        {processing ? 'Uploading...' : 'Upload Photo'}
                    </PrimaryButton>
                </div>
            )}
        </section>
    );
}

