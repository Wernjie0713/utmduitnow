import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { Store, Users, KeySquare, Plus, Trash2 } from 'lucide-react';

export default function Profile({ unit }) {
    // Determine if the current user is the manager
    const { user } = usePage().props.auth;
    const isManager = unit.manager_id === user.id;

    // --- Form 1: Business Details ---
    const { 
        data: detailData, 
        setData: setDetailData, 
        put: putDetails, 
        processing: detailProcessing, 
        errors: detailErrors,
        recentlySuccessful: detailSuccessful
    } = useForm({
        business_name: unit.business_name,
        business_location: unit.business_location,
        course_code: unit.course_code || '',
        section: unit.section || '',
    });

    const updateDetails = (e) => {
        e.preventDefault();
        putDetails(route('shop.update'), {
            preserveScroll: true,
        });
    };

    // --- Form 2: Add Team Member ---
    const {
        data: teamData,
        setData: setTeamData,
        post: postTeam,
        processing: teamProcessing,
        errors: teamErrors,
        reset: resetTeamForm,
    } = useForm({
        member_name: '',
        matric_no: '',
    });

    const addTeamMember = (e) => {
        e.preventDefault();
        postTeam(route('shop.team.add'), {
            preserveScroll: true,
            onSuccess: () => resetTeamForm(),
        });
    };

    // --- Form 3: Add DuitNow ID ---
    const {
        data: idData,
        setData: setIdData,
        post: postId,
        processing: idProcessing,
        errors: idErrors,
        reset: resetIdForm,
    } = useForm({
        duitnow_id: '',
    });

    const addDuitnowId = (e) => {
        e.preventDefault();
        postId(route('shop.duitnow.add'), {
            preserveScroll: true,
            onSuccess: () => resetIdForm(),
        });
    };

    // --- Delete Methods ---
    const removeForm = useForm({});
    
    const removeTeamMember = (memberId) => {
        if (confirm('Are you sure you want to remove this team member?')) {
            removeForm.delete(route('shop.team.remove', memberId), {
                preserveScroll: true,
            });
        }
    };

    const removeDuitnowId = (idId) => {
        if (confirm('Are you sure you want to remove this DuitNow ID?')) {
            removeForm.delete(route('shop.duitnow.remove', idId), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Business Unit Profile
                </h2>
            }
        >
            <Head title="Business Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    
                    {!isManager && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
                            You are viewing this business unit as a team member. Only the manager can make changes.
                        </div>
                    )}

                    {/* Section 1: Business Details update */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Store className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>Business Details</CardTitle>
                                    <CardDescription>Update your business name and location type.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={updateDetails} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="business_name" value="Business Name" />
                                    <TextInput
                                        id="business_name"
                                        type="text"
                                        value={detailData.business_name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setDetailData('business_name', e.target.value)}
                                        required
                                        disabled={!isManager}
                                    />
                                    <InputError message={detailErrors.business_name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="business_location" value="Business Location Type" />
                                    <select
                                        id="business_location"
                                        value={detailData.business_location}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:opacity-50"
                                        onChange={(e) => setDetailData('business_location', e.target.value)}
                                        required
                                        disabled={!isManager}
                                    >
                                        <option value="online">Online Based</option>
                                        <option value="physical">Physical Kiosk / Store</option>
                                    </select>
                                    <InputError message={detailErrors.business_location} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="course_code" value="Course Code" />
                                    <TextInput
                                        id="course_code"
                                        type="text"
                                        value={detailData.course_code}
                                        className="mt-1 block w-full uppercase"
                                        onChange={(e) => setDetailData('course_code', e.target.value.toUpperCase())}
                                        required
                                        disabled={!isManager}
                                    />
                                    <InputError message={detailErrors.course_code} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="section" value="Section Code" />
                                    <TextInput
                                        id="section"
                                        type="text"
                                        value={detailData.section}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setDetailData('section', e.target.value)}
                                        required
                                        disabled={!isManager}
                                    />
                                    <InputError message={detailErrors.section} className="mt-2" />
                                </div>

                                {isManager && (
                                    <div className="flex items-center gap-4 pt-2">
                                        <PrimaryButton disabled={detailProcessing}>Save Changes</PrimaryButton>
                                        {detailSuccessful && <p className="text-sm text-green-600">Saved.</p>}
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Section 2: Team Members Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Users className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>Manage the people involved in your business.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* List of current members */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700">Current Members</h3>
                                <div className="border rounded-md divide-y overflow-hidden">
                                     {/* Manager always listed first, safely fallback if relationships not fully loaded */}
                                     <div className="p-3 bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-sm">Manager (You)</p>
                                        </div>
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full uppercase font-semibold">Manager</span>
                                    </div>

                                    {unit.team_members && unit.team_members.map(member => (
                                        <div key={member.id} className="p-3 bg-white flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">{member.member_name}</p>
                                                <p className="text-xs text-gray-500">{member.matric_no}</p>
                                            </div>
                                            {isManager && (
                                                <button
                                                    onClick={() => removeTeamMember(member.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove Member"
                                                    disabled={removeForm.processing}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {(!unit.team_members || unit.team_members.length === 0) && (
                                        <div className="p-3 bg-white text-sm text-gray-500 italic text-center">
                                            No additional team members yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add new member form */}
                            {isManager && (
                                <form onSubmit={addTeamMember} className="pt-2 border-t flex flex-col sm:flex-row items-end gap-3">
                                    <div className="flex-1 w-full">
                                        <InputLabel htmlFor="member_name" value="Member Name" />
                                        <TextInput
                                            id="member_name"
                                            type="text"
                                            value={teamData.member_name}
                                            onChange={e => setTeamData('member_name', e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="e.g. Ali Bin Abu"
                                            required
                                        />
                                        <InputError message={teamErrors.member_name} className="mt-2" />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <InputLabel htmlFor="new_matric" value="Matric Number" />
                                        <TextInput
                                            id="new_matric"
                                            type="text"
                                            value={teamData.matric_no}
                                            onChange={e => setTeamData('matric_no', e.target.value)}
                                            className="mt-1 block w-full uppercase"
                                            placeholder="e.g. A22EC0000"
                                            required
                                        />
                                        <InputError message={teamErrors.matric_no} className="mt-2" />
                                    </div>
                                    <PrimaryButton type="submit" disabled={teamProcessing} className="mb-[2px] bg-green-600 hover:bg-green-700 w-full sm:w-auto justify-center">
                                        Add
                                    </PrimaryButton>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section 3: DuitNow IDs Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <KeySquare className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle>DuitNow IDs</CardTitle>
                                    <CardDescription>Manage the active registration numbers for this unit.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* List of current IDs */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700">Registered IDs</h3>
                                <div className="border rounded-md divide-y overflow-hidden">
                                    {unit.duitnow_ids && unit.duitnow_ids.map(id => (
                                        <div key={id.id} className="p-3 bg-white flex justify-between items-center">
                                            <p className="font-mono text-sm">{id.duitnow_id}</p>
                                            {isManager && unit.duitnow_ids.length > 1 && (
                                                <button
                                                    onClick={() => removeDuitnowId(id.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove ID"
                                                    disabled={removeForm.processing}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {(!unit.duitnow_ids || unit.duitnow_ids.length === 0) && (
                                        <div className="p-3 bg-white text-sm text-red-500 text-center font-medium">
                                            WARNING: You have no active DuitNow IDs.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add new ID form */}
                            {isManager && (
                                <form onSubmit={addDuitnowId} className="pt-2 border-t flex items-end gap-3">
                                    <div className="flex-1">
                                        <InputLabel htmlFor="new_duitnow" value="Add New DuitNow ID" />
                                        <TextInput
                                            id="new_duitnow"
                                            type="text"
                                            value={idData.duitnow_id}
                                            onChange={e => setIdData('duitnow_id', e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="e.g. 0123456789"
                                            required
                                        />
                                        <InputError message={idErrors.duitnow_id} className="mt-2" />
                                    </div>
                                    <PrimaryButton type="submit" disabled={idProcessing} className="mb-[2px] bg-purple-600 hover:bg-purple-700">
                                        Add
                                    </PrimaryButton>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
