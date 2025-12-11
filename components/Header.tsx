'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  Heart,
  User,
  ChevronDown,
  Home,
  MapPin,
  Building,
  Building2,
  Briefcase,
  Globe,
  Settings,
  FileText,
  LogOut,
  Plus,
  Image as ImageIcon,
  House,
  UserIcon,
  User2Icon,
} from 'lucide-react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
} from '@heroui/react';
import { getUserAvatarPath } from '@/lib/utils/image-path';
import { logout } from '@/lib/actions/user';

export default function Header({
  imagesDomain = '',
}: {
  imagesDomain?: string;
} = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { data: session, status, update } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const imagePath = session.user.image || '';

      if (!imagePath) {
        setImageUrl(null);
        return;
      }

      let newImageUrl: string | null = null;

      if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
        newImageUrl = imagePath;
      } else if (session.user.id) {
        // Add timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        newImageUrl = getUserAvatarPath(
          imagesDomain,
          `${imagePath}?t=${timestamp}`,
          session.user.id
        );
      }

      setImageUrl(newImageUrl);
    } else {
      setImageUrl(null);
    }
  }, [status, session, imagesDomain]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
      await signOut({ callbackUrl: '/', redirect: true });
    }
    onClose();
  };

  return (
    <header className="relative z-50 bg-white/80 shadow-sm backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile: Menu Button + Logo (Left Side) */}
          <div className="flex items-center space-x-3 md:hidden">
            <Button variant="light" isIconOnly onPress={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo-seloger-tchad.svg"
                alt="seloger Tchad Logo"
                width={60}
                height={60}
                className="h-14 w-14"
              />
              <span className="text-primary-700 text-xl font-bold">seloger-tchad</span>
            </Link>
          </div>

          {/* Desktop: Logo (Left Side) */}
          <Link href="/" className="hidden items-center space-x-2 md:flex">
            <Image
              src="/logo-seloger-tchad.svg"
              alt="seloger Tchad Logo"
              width={60}
              height={60}
              className="h-14 w-14"
            />
            <span className="text-2xl font-bold text-emerald-700">seloger-tchad</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('achat')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="text-default-600 hover:text-primary-900 flex items-center py-5 text-sm font-medium transition-colors">
                Acheter
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('location')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="text-default-600 hover:text-primary-900 flex items-center py-5 text-sm font-medium transition-colors">
                Louer
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center space-x-3 md:flex">
            <Link href="/mon-compte/deposer-une-annonce">
              <Button
                variant="bordered"
                radius="full"
                size="sm"
                color="primary"
                className="border border-emerald-100 bg-emerald-600 text-xs text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 focus:ring-0"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Déposer une annonce
              </Button>
            </Link>

            <Tooltip content="Mes favoris">
              <Link href="/mon-compte/mes-favoris">
                <Button
                  size="sm"
                  isIconOnly
                  radius="full"
                  className="border-primary-600 hover:bg-primary-100 border bg-transparent p-0 focus:ring-0"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>
            </Tooltip>

            {session?.user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    as="button"
                    className="border border-emerald-600 bg-emerald-600 transition-transform hover:scale-105 hover:cursor-pointer"
                    src={imageUrl ? imageUrl : undefined}
                    name={`${session.user.firstName?.[0]}${session.user.lastName?.[0]}`}
                    size="sm"
                    radius="full"
                  />
                </DropdownTrigger>
                <DropdownMenu color="default" aria-label="Profile Actions" variant="flat">
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Connecté en tant que</p>
                    <p className="font-semibold">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                  </DropdownItem>
                  <DropdownItem key="account">
                    <Link href="/mon-compte" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Mon compte
                    </Link>
                  </DropdownItem>
                  <DropdownItem key="properties">
                    <Link href="/mon-compte/mes-annonces" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Mes annonces
                    </Link>
                  </DropdownItem>
                  <DropdownItem key="favorites">
                    <Link href="/mon-compte/mes-favoris" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Mes favoris
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    startContent={<LogOut className="h-4 w-4" />}
                    onClick={onOpen}
                  >
                    Déconnexion
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <Tooltip content="Se connecter">
                <Link href="/auth/signin">
                  <Button
                    size="sm"
                    isIconOnly
                    radius="full"
                    className="border-primary-600 hover:bg-primary-100 border bg-transparent p-0 focus:ring-0"
                  >
                    <User2Icon className="h-4 w-4" />
                  </Button>
                </Link>
              </Tooltip>
            )}
          </div>

          {/* Mobile: Favorites & Sign In Buttons (Right Side) */}
          <div className="flex items-center space-x-2 md:hidden">
            <Tooltip content="Mes favoris">
              <Link href="/mon-compte/mes-favoris">
                <Button
                  size="sm"
                  isIconOnly
                  radius="full"
                  className="border-primary-600 hover:bg-primary-100 border bg-transparent p-0 focus:ring-0"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>
            </Tooltip>

            {session?.user ? (
              <Avatar
                as="button"
                className="border border-emerald-600 bg-emerald-600 transition-transform hover:scale-105 hover:cursor-pointer"
                src={imageUrl ? imageUrl : undefined}
                name={`${session.user.firstName?.[0]}${session.user.lastName?.[0]}`}
                size="sm"
                isBordered
                radius="full"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
            ) : (
              <Tooltip content="Se connecter">
                <Link href="/auth/signin">
                  <Button
                    size="sm"
                    isIconOnly
                    radius="full"
                    className="border-primary-600 hover:bg-primary-100 border bg-transparent p-0 focus:ring-0"
                  >
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Full-width Dropdown Menus */}
        {activeDropdown === 'achat' && (
          <div
            className="absolute top-full left-0 z-50 -mt-px w-full border-b border-gray-200 bg-white shadow-lg"
            onMouseEnter={() => setActiveDropdown('achat')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Link
                  href="/rechercher?propertyTypes=terrain&transactionType=achat"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <MapPin className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Terrain
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Acheter un terrain</span>
                </Link>
                <Link
                  href="/rechercher?propertyTypes=maison&transactionType=achat"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Home className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Maison
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Acheter une maison</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=villa&transactionType=achat"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Building2 className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Villa
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Acheter une villa</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=immeuble&transactionType=achat"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Building className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Immeuble
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Acheter un immeuble</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=bureau_commerce&transactionType=achat"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Briefcase className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Bureaux & Commerces
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Acheter un local commercial</span>
                </Link>
                <Link
                  href="/rechercher?propertyTypes=terrain_agricole&transactionType=achat"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <ImageIcon className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Terrain agricole
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Acheter un terrain agricole</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeDropdown === 'location' && (
          <div
            className="bg-background border-content4 absolute top-full left-0 z-50 -mt-px w-full border-b shadow-lg"
            onMouseEnter={() => setActiveDropdown('location')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Link
                  href="/rechercher?propertyTypes=appartement&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <House className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Appartement
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer un appartement</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=maison&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Home className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Maison
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer une maison</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=villa&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Building2 className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Villa
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer une villa</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=immeuble&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Building className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Immeuble
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer un immeuble</span>
                </Link>

                <Link
                  href="/rechercher?propertyTypes=bureau_commerce&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Briefcase className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Bureaux & Commerces
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer un local</span>
                </Link>
                <Link
                  href="/rechercher?propertyTypes=terrain&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <MapPin className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Terrain
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer un terrain</span>
                </Link>
                <Link
                  href="/rechercher?propertyTypes=terrain&transactionType=location"
                  className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="bg-primary-100 group-hover:bg-primary-200 mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Globe className="text-primary-900 h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                    Terrain agricole
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">Louer un terrain agricole</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-content4 border-t py-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              <div className="space-y-2">
                <div className="text-default-700 font-medium">Acheter</div>
                <div className="space-y-2 pl-4">
                  <Link
                    href="/rechercher?propertyTypes=maison&transactionType=achat"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Maison
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=terrain&transactionType=achat"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Terrain
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=villa&transactionType=achat"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Villa
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=immeuble&transactionType=achat"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Immeuble
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=bureau_commerce&transactionType=achat"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bureaux & Commerces
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-default-700 font-medium">Louer</div>
                <div className="space-y-2 pl-4">
                  <Link
                    href="/rechercher?propertyTypes=appartement&transactionType=location"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Appartement
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=maison&transactionType=location"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Maison
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=villa&transactionType=location"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Villa
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=immeuble&transactionType=location"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Immeuble
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=bureau_commerce&transactionType=location"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bureaux & Commerces
                  </Link>
                  <Link
                    href="/rechercher?propertyTypes=terrain&transactionType=location"
                    className="text-default-600 hover:text-primary-900 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Terrain agricole
                  </Link>
                </div>
              </div>
              <Divider />

              {session?.user ? (
                <div className="flex flex-col space-y-2">
                  <div className="text-default-700 px-3 py-2 text-sm font-medium">
                    Bonjour, {session.user.firstName}
                  </div>
                  <Link
                    href="/mon-compte/deposer-une-annonce"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Déposer une annonce
                  </Link>
                  <Link
                    href="/mon-compte"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Mon compte
                  </Link>
                  <Link
                    href="/mon-compte/mes-annonces"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Mes annonces
                  </Link>
                  <Link
                    href="/mon-compte/mes-favoris"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Mes favoris
                  </Link>
                  <Divider />
                  <Button
                    variant="bordered"
                    size="sm"
                    onPress={() => {
                      setIsMenuOpen(false);
                      onOpen();
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/auth/signin"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Se Connecter
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Créer un compte
                  </Link>
                  <Divider />
                  <Link
                    href="/mon-compte/deposer-une-annonce"
                    className="text-default-700 hover:text-primary-900 flex items-center px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Déposer une annonce
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Confirmation de déconnexion</ModalHeader>
          <ModalBody>
            <p>Êtes-vous sûr de vouloir vous déconnecter de votre compte?</p>
          </ModalBody>
          <ModalFooter>
            <Button radius="full" variant="bordered" onPress={onClose}>
              Annuler
            </Button>
            <Button
              color="warning"
              radius="full"
              onPress={handleSignOut}
              startContent={<LogOut className="h-4 w-4" />}
              isLoading={isLoggingOut}
            >
              Se déconnecter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </header>
  );
}
