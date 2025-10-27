import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import UserAvatar from '@/Components/UserAvatar';
import { Link, usePage } from '@inertiajs/react';
import { 
    SidebarProvider, 
    Sidebar, 
    SidebarContent, 
    SidebarGroup, 
    SidebarGroupContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarHeader, 
    SidebarFooter, 
    SidebarTrigger, 
    SidebarInset,
    SidebarSeparator,
    useSidebar
} from '@/Components/animate-ui/components/radix/sidebar';
import { Home, Upload, List, User, LogOut, Settings, ChevronDown, Trophy, ListOrdered, Menu, X } from 'lucide-react';

// Inner component that uses useSidebar hook
function AuthenticatedLayoutInner({ user, isAdmin, header, children }) {
    const { toggleSidebar, isMobile } = useSidebar();

    const studentNavItems = [
        { name: 'Dashboard', href: 'dashboard', icon: Home },
        { name: 'Submit Transaction', href: 'transactions.submit', icon: Upload },
        { name: 'My Transactions', href: 'transactions.my', icon: List },
        { name: 'Full Rankings', href: 'leaderboard.full', icon: Trophy },
    ];

    const adminNavItems = [
        { name: 'Dashboard', href: 'admin.dashboard', icon: Home },
        { name: 'User Management', href: 'admin.users', icon: User },
        { name: 'Full Rankings', href: 'leaderboard.full', icon: Trophy },
    ];

    const navItems = isAdmin ? adminNavItems : studentNavItems;

    // Debug navigation
    console.log('=== Navigation Debug ===');
    console.log('Is Admin (inner):', isAdmin);
    console.log('Selected Nav Items:', navItems);
    console.log('========================');

    return (
        <>
            <Sidebar 
                collapsible={isMobile ? "offcanvas" : "icon"} 
                variant="sidebar"
            >
                <SidebarHeader>
                    {/* Logo centered at top */}
                    <div className="flex h-14 items-center justify-center px-4 border-b group-data-[collapsible=icon]:justify-center">
                        <Link href={route(isAdmin ? 'admin.dashboard' : 'dashboard')} className="flex items-center gap-2">
                            <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
                                UTM DuitNow 
                            </span>
                        </Link>
                    </div>
                    
                    {/* Avatar and Name Section - Centered */}
                    <div className="flex flex-col items-center py-6 px-4 group-data-[collapsible=icon]:py-4">
                        <div className="border-4 border-white shadow-lg rounded-full group-data-[collapsible=icon]:border-2">
                            <UserAvatar 
                                user={user}
                                className="h-20 w-20 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10"
                            />
                        </div>
                        <p className="mt-3 font-semibold text-center group-data-[collapsible=icon]:hidden">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500 group-data-[collapsible=icon]:hidden">
                            {user.email}
                        </p>
                    </div>
                    
                    {/* Collapse/Expand Button */}
                    <div className="flex justify-end px-4 pb-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                        <SidebarTrigger />
                    </div>
                </SidebarHeader>
                
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu className="space-y-1">
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton 
                                            asChild 
                                            isActive={route().current(item.href)}
                                        >
                                            <Link href={route(item.href)}>
                                                <item.icon className="flex-shrink-0" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                
                <SidebarFooter>
                    <SidebarSeparator />
                    <SidebarMenu className="space-y-1">
                        {!isAdmin && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={route('profile.edit')}>
                                        <Settings className="flex-shrink-0" />
                                        <span>Profile Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href={route('logout')} method="post" as="button">
                                    <LogOut className="flex-shrink-0" />
                                    <span>Log Out</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                    {/* Mobile/Tablet Menu Button */}
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    )}
                    
                    {header && (
                        <div className="flex-1 min-w-0 px-4">
                            <div className="truncate">
                                {header}
                            </div>
                        </div>
                    )}
                    
                    {/* User Dropdown in Header */}
                    <div className="ml-auto">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100">
                                    <div className="border-2 border-gray-200 rounded-full">
                                        <UserAvatar 
                                            user={user}
                                            className="h-10 w-10"
                                        />
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right">
                                <div className="px-4 py-2 border-b">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</p>
                                </div>
                                {!isAdmin && (
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile Settings
                                    </Dropdown.Link>
                                )}
                                <Dropdown.Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                >
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </SidebarInset>
        </>
    );
}

// Main component that provides context
export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const isAdmin = user?.roles?.some(role => role.name === 'admin') || false;

    // Debug logging
    console.log('=== AuthenticatedLayout Debug ===');
    console.log('User:', user);
    console.log('User roles:', user?.roles);
    console.log('Is Admin:', isAdmin);
    console.log('================================');

    return (
        <SidebarProvider defaultOpen={true}>
            <AuthenticatedLayoutInner 
                user={user} 
                isAdmin={isAdmin} 
                header={header} 
                children={children}
            />
        </SidebarProvider>
    );
}
