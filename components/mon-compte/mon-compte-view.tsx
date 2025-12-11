'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Camera,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash,
  AlertTriangle,
  CheckCircle,
  Lock,
  Bell,
  SendIcon,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Tabs,
  Tab,
  Avatar,
  Chip,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import {
  changeAccountRequest,
  changePassword,
  deleteUser,
  cancelDeleteAccountRequest,
  deleteUserImage,
  getUserProfile,
  sendVerificationEmail,
  sendVerificationPhone,
  updateUserImage,
  updateUserInfos,
  updateUserSettings,
} from '@/lib/actions/user';
import { convertFileToBase64 } from '@/lib/files/files';
import { MAX_FILE_SIZE } from '@/lib/config';
import { UserStatusEnum } from '@/types/user';
import { getUserAvatarPath } from '@/lib/utils/image-path';

const emptyErrorMessages = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  currentPassword: '',
  newEmail: '',
};

export default function MonCompteView({ imagesDomain }: { imagesDomain: string }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState('personal');
  const [errorMessages, setErrorMessages] = useState(emptyErrorMessages);

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    image: '',
    acceptMarketing: false,
  });

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({
    acceptEmailContact: true,
    acceptPhoneContact: true,
    displayEmail: false,
    displayPhone: false,
  });

  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
    newEmail: '',
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [sendingPhoneVerification, setSendingPhoneVerification] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [messages, setMessages] = useState({
    personal: '',
    privacy: '',
    security: '',
    emailVerification: '',
    phoneVerification: '',
  });
  const [errors, setErrors] = useState({
    personal: '',
    privacy: '',
    security: '',
    emailVerification: '',
    phoneVerification: '',
  });

  // Delete account modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionReasonError, setDeletionReasonError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // Load user info
        const user = await getUserProfile();
        if (user) {
          // Check user status
          if (user.status === UserStatusEnum.supprime || user.status === UserStatusEnum.bloque) {
            await signOut({ redirect: true, callbackUrl: '/' });
            return;
          }

          let imageUrl = user.image ?? '/logo-gray-seloger-tchad.svg';
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            // Add timestamp to prevent caching issues
            const timestamp = new Date().getTime();
            imageUrl = getUserAvatarPath(
              imagesDomain,
              `${imageUrl}?t=${timestamp}`,
              user.id as string
            );
          }

          setPersonalInfo({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            image: imageUrl,
            acceptMarketing: user.acceptMarketing || false,
          });

          setPrivacySettings({
            acceptEmailContact: user.settings?.acceptEmailContact ?? true,
            acceptPhoneContact: user.settings?.acceptPhoneContact ?? true,
            displayEmail: user.settings?.displayEmail ?? false,
            displayPhone: user.settings?.displayPhone ?? false,
          });

          return;
        }

        throw new Error('Failed to load user profile');
      } catch (error) {
        console.error('Error loading user data:', error);
        setErrors((prev) => ({ ...prev, personal: 'Erreur lors du chargement des données' }));
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [session, imagesDomain]);

  // Refresh user profile data
  const handleRefreshProfile = async () => {
    if (!session?.user?.id) return;

    setRefreshingProfile(true);
    setErrors((prev) => ({ ...prev, personal: '' }));
    setMessages((prev) => ({ ...prev, personal: '' }));

    try {
      const user = await getUserProfile();
      if (user) {
        let imageUrl = user.image ?? '/logo-gray-seloger-tchad.svg';
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          // Add timestamp to prevent caching issues
          const timestamp = new Date().getTime();
          imageUrl = getUserAvatarPath(
            imagesDomain,
            `${imageUrl}?t=${timestamp}`,
            user.id as string
          );
        }

        setPersonalInfo({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          image: imageUrl,
          acceptMarketing: user.acceptMarketing || false,
        });

        // Update session to reflect changes in Header
        // Pass the raw user object so the session updates correctly
        await update({
          user: {
            ...user,
            // Ensure the image path is updated in session
            image: user.image,
          },
        });

        setMessages((prev) => ({
          ...prev,
          personal: 'Profil rafraîchi avec succès',
        }));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setErrors((prev) => ({
        ...prev,
        personal: 'Erreur lors du rafraîchissement du profil',
      }));
    } finally {
      setRefreshingProfile(false);
    }
  };

  const handleInputPersonalInfoChange = (field: string, value: string | boolean) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
    setErrorMessages(emptyErrorMessages);
  };

  const handleInputSecurityChange = (field: string, value: string | boolean) => {
    setSecurityInfo((prev) => ({ ...prev, [field]: value }));
    setErrorMessages(emptyErrorMessages);
  };

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, personal: 'Veuillez sélectionner un fichier image valide' }));
      return;
    }

    // Validate file extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setErrors((prev) => ({
        ...prev,
        personal: 'Veuillez sélectionner un fichier image valide (jpg, jpeg, png, webp)',
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, personal: "La taille de l'image ne peut pas dépasser 5MB" }));
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);

    // Clear any previous errors
    setErrors((prev) => ({ ...prev, personal: '' }));
  };

  // Convert image to base64 and upload
  const handleImageUpload = async () => {
    if (!imageFile || !session?.user?.id) return;

    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, personal: '' }));
    setMessages((prev) => ({ ...prev, personal: '' }));

    try {
      const base64File: string = await convertFileToBase64(imageFile);

      try {
        const userData = await updateUserImage(session.user.id, base64File);

        setImageFile(null);
        setImagePreview('');
        setMessages((prev) => ({
          ...prev,
          personal: 'Votre photo de profil a bien été envoyée, elle est en attente de publication.',
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        setErrors((prev) => ({ ...prev, personal: "Erreur lors de l'upload de l'image" }));
      } finally {
        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setErrors((prev) => ({ ...prev, personal: "Erreur lors du traitement de l'image" }));
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!session?.user?.id) return;
    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, personal: '' }));
    setMessages((prev) => ({ ...prev, personal: '' }));

    try {
      const userData = await deleteUserImage(session.user.id);

      setPersonalInfo((prev) => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        image: userData.image || '',
        acceptMarketing: userData.acceptMarketing || false,
      }));
      setImageFile(null);
      setImagePreview('');
      setMessages((prev) => ({ ...prev, personal: 'Photo de profil supprimée avec succès' }));
      // Update session
      await update({ user: userData });
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors((prev) => ({ ...prev, personal: "Erreur lors de l'upload de l'image" }));
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove uploaded image
  const handleRemoveSelectedImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // Handle personal info update
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSaving(true);
    setErrors((prev) => ({ ...prev, personal: '' }));
    setMessages((prev) => ({ ...prev, personal: '' }));

    try {
      const response = await updateUserInfos(session.user.id, {
        phone: personalInfo.phone,
        lastName: personalInfo.lastName,
        firstName: personalInfo.firstName,
      });

      if ('errors' in response) {
        const errors = {
          firstName: response.errors.firstName?.[0] || '',
          lastName: response.errors.lastName?.[0] || '',
          phone: response.errors.phone?.[0] || '',
        };

        setErrorMessages((prev) => ({ ...prev, ...errors }));
        setErrors((prev) => ({ ...prev, personal: response.message }));
        return;
      }

      setPersonalInfo((prev) => ({ ...prev, ...response }));
      setMessages((prev) => ({ ...prev, personal: 'Informations mises à jour avec succès' }));

      addToast({
        color: 'success',
        title: 'Informations personnelles mises à jour!',
        description: 'Vos informations personnelles ont été mises à jour avec succès.',
        timeout: 5000,
      });

      setTimeout(() => {
        handleRefreshProfile();
      }, 5000);
    } catch (error) {
      console.error('Error updating personal info:', error);
      setErrors((prev) => ({
        ...prev,
        personal: 'Erreur lors de la mise à jour des informations personnelles',
      }));
    } finally {
      setSaving(false);
    }
  };

  // Handle privacy settings update
  const handlePrivacySettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSaving(true);
    setErrors((prev) => ({ ...prev, privacy: '' }));
    setMessages((prev) => ({ ...prev, privacy: '' }));

    try {
      const response = await updateUserSettings(session.user.id, privacySettings);

      if ('errors' in response) {
        //setErrorMessages((prev) => ({ ...prev, ...errors }));
        setErrors((prev) => ({ ...prev, privacy: response.message }));
        return;
      }

      setMessages((prev) => ({
        ...prev,
        privacy: 'Préférences de confidentialité mises à jour avec succès',
      }));
      setPrivacySettings((prev) => ({ ...prev, ...response.settings }));

      addToast({
        color: 'success',
        title: 'Préférences de confidentialité mises à jour!',
        description: 'Vos préférences de confidentialité ont été mises à jour avec succès.',
        timeout: 5000,
      });

      setTimeout(() => {
        handleRefreshProfile();
      }, 5000);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setErrors((prev) => ({
        ...prev,
        privacy: 'Erreur lors de la mise à jour des Préférences de confidentialité',
      }));
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSaving(true);
    setErrors((prev) => ({ ...prev, security: '' }));
    setMessages((prev) => ({ ...prev, security: '' }));

    try {
      const response = await changePassword(session.user.id, {
        oldPassword: securityInfo.currentPassword,
        password: securityInfo.password,
        confirmPassword: securityInfo.confirmPassword,
      });

      if ('errors' in response) {
        setErrorMessages((prev) => ({ ...prev, ...response.errors }));
        setErrors((prev) => ({ ...prev, security: response.message ?? '' }));
        return;
      }

      setMessages((prev) => ({ ...prev, security: 'Mot de passe modifié avec succès' }));
      setSecurityInfo((prev) => ({
        ...prev,
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }));
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors((prev) => ({ ...prev, security: 'Erreur lors du changement de mot de passe' }));
    } finally {
      setSaving(false);
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!session?.user?.id || !securityInfo.newEmail) return;

    setSaving(true);
    setErrors((prev) => ({ ...prev, security: '' }));
    setMessages((prev) => ({ ...prev, security: '' }));

    try {
      const response = await changeAccountRequest(session.user.id, {
        email: personalInfo.email,
        newEmail: securityInfo.newEmail,
      });

      if ('errors' in response) {
        setErrorMessages((prev) => ({ ...prev, ...response.errors }));
        setErrors((prev) => ({ ...prev, security: response.message ?? '' }));
        addToast({
          color: 'danger',
          title: "Erreur changement d'email!",
          description: response.message ?? "Erreur lors du changement d'email.",
          timeout: 5000,
        });

        return;
      }

      setMessages((prev) => ({
        ...prev,
        security:
          "Votre demande de changement d'email a été envoyée avec succès. Veuillez vérifier votre nouvelle adresse email pour confirmer le changement.",
      }));

      addToast({
        color: 'success',
        title: "Demande de changement d'email envoyée!",
        description:
          "Votre demande de changement d'email a été envoyée avec succès. Veuillez vérifier votre nouvelle adresse email pour confirmer le changement.",
        timeout: 5000,
      });
    } catch (error) {
      console.error('Error changing email:', error);
      setErrors((prev) => ({ ...prev, security: "Erreur lors du changement d'email" }));
    } finally {
      setSaving(false);
    }
  };

  // Handle email verification
  const handleSendEmailVerification = async () => {
    if (!session?.user?.id) return;

    setSendingEmailVerification(true);
    setErrors((prev) => ({ ...prev, emailVerification: '' }));
    setMessages((prev) => ({ ...prev, emailVerification: '' }));

    try {
      await sendVerificationEmail(session.user.id);

      setMessages((prev) => ({
        ...prev,
        emailVerification: 'Email de vérification envoyé avec succès',
      }));
    } catch (error) {
      console.error('Error sending email verification:', error);
      setErrors((prev) => ({
        ...prev,
        emailVerification: "Erreur lors de l'envoi de l'email de vérification",
      }));
    } finally {
      setSendingEmailVerification(false);
    }
  };

  // Handle phone verification
  const handleSendPhoneVerification = async () => {
    if (!session?.user?.id) return;

    setSendingPhoneVerification(true);
    setErrors((prev) => ({ ...prev, phoneVerification: '' }));
    setMessages((prev) => ({ ...prev, phoneVerification: '' }));

    try {
      await sendVerificationPhone(session.user.id);

      setMessages((prev) => ({
        ...prev,
        phoneVerification: 'SMS de vérification envoyé avec succès',
      }));
    } catch (error) {
      console.error('Error sending phone verification:', error);

      setErrors((prev) => ({
        ...prev,
        phoneVerification: "Erreur lors de l'envoi du SMS de vérification",
      }));
    } finally {
      setSendingPhoneVerification(false);
    }
  };

  // Handle delete account modal
  const handleOpenDeleteModal = () => {
    setDeletionReason('');
    setDeletionReasonError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletionReason('');
    setDeletionReasonError('');
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    // Validate deletion reason
    if (!deletionReason.trim()) {
      setDeletionReasonError('Veuillez indiquer la raison de la suppression de votre compte');
      return;
    }

    if (deletionReason.trim().length < 10) {
      setDeletionReasonError('La raison doit contenir au moins 10 caractères');
      return;
    }

    setSaving(true);
    setDeletionReasonError('');
    setErrors((prev) => ({ ...prev, security: '' }));
    setMessages((prev) => ({ ...prev, security: '' }));

    try {
      const response = await deleteUser(session.user.id, deletionReason.trim());

      if ('errors' in response) {
        setErrors((prev) => ({
          ...prev,
          security: response.message ?? 'Erreur lors de la suppression du compte',
        }));
        handleCloseDeleteModal();
        return;
      }

      addToast({
        title: 'Demande de suppression enregistrée!',
        description: 'Votre demande de suppression a été enregistrée avec succès.',
        color: 'success',
        timeout: 5000,
      });

      setMessages((prev) => ({
        ...prev,
        security: 'Votre demande de suppression a été enregistrée avec succès',
      }));

      handleCloseDeleteModal();
      setTimeout(() => {
        handleRefreshProfile();
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      setErrors((prev) => ({ ...prev, security: 'Erreur lors de la suppression du compte' }));
      handleCloseDeleteModal();
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel delete account request
  const handleCancelDeleteRequest = async () => {
    if (!session?.user?.id) return;

    setSaving(true);
    setErrors((prev) => ({ ...prev, security: '' }));
    setMessages((prev) => ({ ...prev, security: '' }));

    try {
      const response = await cancelDeleteAccountRequest(session.user.id);

      if ('errors' in response) {
        setErrors((prev) => ({
          ...prev,
          security: response.message ?? "Erreur lors de l'annulation de la demande de suppression",
        }));

        addToast({
          title: "Erreur lors de l'annulation de la demande de suppression!",
          description:
            response.message ?? "Erreur lors de l'annulation de la demande de suppression.",
          color: 'danger',
          timeout: 5000,
        });

        return;
      }

      addToast({
        title: 'Annulation demande de suppression!',
        description: 'Votre demande de suppression a été annulée avec succès.',
        color: 'success',
        timeout: 5000,
      });

      setMessages((prev) => ({
        ...prev,
        security: 'Votre demande de suppression a été annulée avec succès',
      }));

      setTimeout(() => {
        handleRefreshProfile();
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de l'annulation de la demande de suppression:", error);
      setErrors((prev) => ({
        ...prev,
        security: "Erreur lors de l'annulation de la demande de suppression",
      }));
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading || refreshingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header Skeleton */}
          <div className="mb-12 text-center">
            <div className="animate-pulse">
              <div className="relative mb-6 inline-block">
                <div className="h-24 w-24 rounded-full bg-gray-300"></div>
                <div className="absolute -right-2 -bottom-2">
                  <div className="h-6 w-16 rounded-full bg-gray-300"></div>
                </div>
              </div>
              <div className="mb-3 flex justify-center">
                <div className="h-10 w-64 rounded bg-gray-300"></div>
              </div>
              <div className="mb-2 flex justify-center">
                <div className="h-6 w-48 rounded bg-gray-300"></div>
              </div>
              <div className="flex justify-center">
                <div className="h-5 w-40 rounded bg-gray-300"></div>
              </div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="animate-pulse space-y-8">
            <div className="flex justify-around border-b border-gray-200 pb-4">
              <div className="h-10 w-32 rounded bg-gray-300"></div>
              <div className="h-10 w-32 rounded bg-gray-300"></div>
              <div className="h-10 w-32 rounded bg-gray-300"></div>
            </div>

            {/* Card Content Skeleton */}
            <div className="rounded-2xl border-0 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gray-300"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-7 w-64 rounded bg-gray-300"></div>
                    <div className="h-5 w-48 rounded bg-gray-300"></div>
                  </div>
                </div>
              </div>

              {/* Avatar Section Skeleton */}
              <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex flex-col items-center space-y-6 md:flex-row md:space-y-0 md:space-x-6">
                  <div className="h-24 w-24 rounded-full bg-gray-300"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-6 w-32 rounded bg-gray-300"></div>
                    <div className="h-4 w-full max-w-md rounded bg-gray-300"></div>
                    <div className="flex gap-2">
                      <div className="h-9 w-36 rounded-full bg-gray-300"></div>
                      <div className="h-9 w-24 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="h-4 w-16 rounded bg-gray-300"></div>
                    <div className="h-14 w-full rounded-xl bg-gray-300"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 rounded bg-gray-300"></div>
                    <div className="h-14 w-full rounded-xl bg-gray-300"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="h-4 w-16 rounded bg-gray-300"></div>
                    <div className="h-14 w-full rounded-xl bg-gray-300"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 rounded bg-gray-300"></div>
                    <div className="h-14 w-full rounded-xl bg-gray-300"></div>
                  </div>
                </div>

                {/* Marketing Consent Skeleton */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 h-6 w-6 rounded bg-gray-300"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-48 rounded bg-gray-300"></div>
                      <div className="h-4 w-full rounded bg-gray-300"></div>
                    </div>
                  </div>
                </div>

                {/* Submit Button Skeleton */}
                <div className="flex justify-center">
                  <div className="h-12 w-64 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="relative mb-6 inline-block">
            <Avatar
              src={personalInfo.image}
              name={`${personalInfo.firstName?.[0]}${personalInfo.lastName?.[0]}`}
              className="h-24 w-24 text-2xl"
              isBordered
              color="primary"
            />
            <div className="absolute -right-2 -bottom-2">
              <Chip color="success" variant="solid" size="sm">
                {session?.user?.status === 'valide' ? 'Vérifié' : 'En attente'}
              </Chip>
            </div>
          </div>
          <h1 className="text-default-900 mb-3 text-4xl font-bold">
            {personalInfo.firstName} {personalInfo.lastName}
          </h1>
          <p className="text-default-600 mb-2 text-xl">{personalInfo.email}</p>
          <p className="text-default-500">
            Membre depuis{' '}
            {new Date(session?.user?.createdAt || '').toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <Tabs
          aria-label="Account settings"
          className="space-y-8"
          variant="underlined"
          color="primary"
          size="lg"
          fullWidth
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(String(key))}
        >
          <Tab
            key="personal"
            title={
              <div className="flex items-center gap-3 px-4 py-2">
                <User className="h-5 w-5" />
                <span className="font-medium">Profil</span>
              </div>
            }
          >
            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="text-foreground pb-6">
                <div className="flex items-center gap-3">
                  <div className="from-primary-100 to-primary-200 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                    <User className="text-primary-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-default-900 text-2xl font-bold">
                      Informations personnelles
                    </h3>
                    <p className="text-default-600">Gérez vos informations de profil</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                {messages.personal && (
                  <div className="bg-primary-50 border-primary-200 mb-6 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="text-success-600 mr-3 h-5 w-5" />
                        <span className="text-success-800 font-medium">{messages.personal}</span>
                      </div>
                      <Button
                        size="sm"
                        color="success"
                        radius="full"
                        onPress={handleRefreshProfile}
                        isLoading={refreshingProfile}
                        isDisabled={refreshingProfile}
                        startContent={!refreshingProfile && <RefreshCw className="h-4 w-4" />}
                        className="border-primary-300 hover:bg-primary-300 text-primary-900 border bg-white/80"
                      >
                        {refreshingProfile ? 'Actualisation...' : 'Actualiser'}
                      </Button>
                    </div>
                  </div>
                )}

                {errors.personal && (
                  <div className="bg-danger-50 border-danger-200 mb-6 rounded-xl border p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="text-danger-600 mr-3 h-5 w-5" />
                      <span className="text-danger-800 font-medium">{errors.personal}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePersonalInfoSubmit} className="space-y-8">
                  {/* Avatar Section */}
                  <Card className="bg-primary-10 border-primary-100 border shadow-none">
                    <CardBody className="p-6">
                      <div className="flex flex-col items-center space-y-6 md:flex-row md:space-y-0 md:space-x-6">
                        <div className="relative">
                          <Avatar
                            src={imagePreview || personalInfo.image}
                            name={`${personalInfo.firstName?.[0]}${personalInfo.lastName?.[0]}`}
                            className="h-24 w-24 text-2xl"
                            isBordered
                            color="primary"
                          />
                          <label
                            htmlFor="image-upload"
                            className="absolute -right-2 -bottom-2 cursor-pointer"
                          >
                            <div className="bg-primary-500 hover:bg-primary-600 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-colors">
                              <Camera className="h-4 w-4 text-white" />
                            </div>
                          </label>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-default-900 mb-2 text-lg font-semibold">
                            Photo de profil
                          </h4>
                          <p className="text-default-600 mb-4 text-sm">
                            Téléchargez une photo de profil (JPG, JPEG, PNG, WEBP, max 5MB)
                          </p>

                          {imageFile && (
                            <div className="bg-primary-50 border-primary-200 mb-4 flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex-1">
                                <p className="text-primary-900 text-sm font-medium">
                                  {imageFile.name}
                                </p>
                                <p className="text-primary-600 text-xs">
                                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                size="sm"
                                color="primary"
                                onPress={handleImageUpload}
                                isLoading={uploadingImage}
                                isDisabled={uploadingImage}
                                radius="full"
                                className="border-primary-300 hover:bg-primary-300 text-primary-900 border bg-white/80"
                              >
                                <SendIcon className="mr-2 h-4 w-4" />
                                {uploadingImage ? 'Téléchargement...' : 'Envoyer'}
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                radius="full"
                                onPress={handleRemoveSelectedImage}
                                isDisabled={uploadingImage}
                                isIconOnly
                                className="border-danger-300 hover:bg-danger-300 hover:text-primary-900 text-danger border bg-white/80"
                              >
                                ×
                              </Button>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <label htmlFor="image-upload">
                              <Button
                                as="span"
                                variant="bordered"
                                size="sm"
                                radius="full"
                                startContent={<Camera className="h-4 w-4" />}
                                className="border-primary-300 hover:bg-primary-300 cursor-pointer border"
                              >
                                Choisir une photo
                              </Button>
                            </label>

                            {personalInfo.image && !personalInfo.image.startsWith('/logo') && (
                              <Button
                                size="sm"
                                color="danger"
                                radius="full"
                                onPress={handleImageDelete}
                                startContent={<Trash className="h-4 w-4" />}
                                isDisabled={uploadingImage}
                                isLoading={uploadingImage}
                                className="border-danger-300 hover:bg-danger-300 text-danger hover:text-primary-900 border bg-white/80"
                              >
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Input
                        label="Prénom"
                        labelPlacement="outside"
                        value={personalInfo.firstName}
                        onChange={(e) => handleInputPersonalInfoChange('firstName', e.target.value)}
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        startContent={<User className="text-default-400 h-4 w-4" />}
                        errorMessage={errorMessages.firstName}
                        isInvalid={errorMessages.firstName !== ''}
                      />
                    </div>
                    <div>
                      <Input
                        label="Nom"
                        labelPlacement="outside"
                        value={personalInfo.lastName}
                        onChange={(e) => handleInputPersonalInfoChange('lastName', e.target.value)}
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        startContent={<User className="text-default-400 h-4 w-4" />}
                        errorMessage={errorMessages.lastName}
                        isInvalid={errorMessages.lastName !== ''}
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Input
                        label="Email"
                        labelPlacement="outside"
                        type="email"
                        value={personalInfo.email}
                        startContent={<Mail className="text-default-400 h-4 w-4" />}
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        isReadOnly
                        isDisabled
                        isRequired
                      />
                      {!session?.user?.validatedAt && (
                        <div className="space-y-2">
                          <p className="text-warning-600 flex items-center gap-1 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Votre email n'est pas encore vérifié
                          </p>
                          {messages.emailVerification && (
                            <p className="text-success-600 flex items-center gap-1 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              {messages.emailVerification}
                            </p>
                          )}
                          {errors.emailVerification && (
                            <p className="text-danger-600 flex items-center gap-1 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              {errors.emailVerification}
                            </p>
                          )}
                          <div className="flex">
                            <Button
                              size="sm"
                              color="warning"
                              variant="bordered"
                              radius="full"
                              onPress={handleSendEmailVerification}
                              isLoading={sendingEmailVerification}
                              isDisabled={sendingEmailVerification}
                              startContent={
                                !sendingEmailVerification && <Mail className="h-4 w-4" />
                              }
                              className="text-warning-900 border-warning-600 hover:border-warning hover:bg-warning border bg-transparent"
                            >
                              {sendingEmailVerification
                                ? 'Envoi...'
                                : "Envoyer l'email de vérification"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        label="Téléphone"
                        labelPlacement="outside"
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => handleInputPersonalInfoChange('phone', e.target.value)}
                        startContent={<Phone className="text-default-400 h-4 w-4" />}
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        errorMessage={errorMessages.phone}
                        isInvalid={errorMessages.phone !== ''}
                        isRequired
                      />
                      {!session?.user?.verifiedAt && (
                        <div className="space-y-2">
                          <p className="text-warning-600 flex items-center gap-1 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Votre numéro de téléphone n'est pas encore vérifié
                          </p>
                          {messages.phoneVerification && (
                            <p className="text-success-600 flex items-center gap-1 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              {messages.phoneVerification}
                            </p>
                          )}
                          {errors.phoneVerification && (
                            <p className="text-danger-600 flex items-center gap-1 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              {errors.phoneVerification}
                            </p>
                          )}
                          <div className="flex">
                            <Button
                              size="sm"
                              color="warning"
                              variant="bordered"
                              radius="full"
                              onPress={handleSendPhoneVerification}
                              isLoading={sendingPhoneVerification}
                              isDisabled={sendingPhoneVerification}
                              startContent={
                                !sendingPhoneVerification && <Phone className="h-4 w-4" />
                              }
                              className="text-warning-900 border-warning-600 hover:border-warning hover:bg-warning border bg-transparent"
                            >
                              {sendingPhoneVerification
                                ? 'Envoi...'
                                : 'Envoyer le SMS de vérification'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marketing Consent */}
                  <Card className="bg-primary-10 border-primary-100 border shadow-none">
                    <CardBody className="p-6">
                      <div className="flex items-start space-x-4">
                        <Bell className="text-primary-600 mt-1 h-6 w-6" />
                        <div className="flex-1">
                          <h4 className="text-default-900 mb-2 text-lg font-semibold">
                            Préférences de communication
                          </h4>
                          <Checkbox
                            isSelected={personalInfo.acceptMarketing}
                            onValueChange={(checked) =>
                              handleInputPersonalInfoChange('acceptMarketing', checked as boolean)
                            }
                            size="md"
                          >
                            <span className="text-default-700">
                              J'accepte de recevoir des communications marketing et des mises à jour
                            </span>
                          </Checkbox>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      isDisabled={saving || !personalInfo.acceptMarketing}
                      color="primary"
                      size="lg"
                      radius="full"
                      className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                      isLoading={saving}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </Tab>

          <Tab
            key="privacy"
            title={
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <span className="font-medium">Confidentialité</span>
              </div>
            }
          >
            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="text-foreground pb-6">
                <div className="flex items-center gap-3">
                  <div className="from-secondary-100 to-secondary-200 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                    <Eye className="text-secondary-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-default-900 text-2xl font-bold">Confidentialité</h3>
                    <p className="text-default-600">Contrôlez vos préférences de confidentialité</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                {messages.privacy && (
                  <div className="bg-primary-50 border-primary-200 mb-6 rounded-xl border p-4">
                    <div className="flex items-center">
                      <CheckCircle className="text-success-600 mr-3 h-5 w-5" />
                      <span className="text-success-800 font-medium">{messages.privacy}</span>
                    </div>
                  </div>
                )}

                {errors.privacy && (
                  <div className="bg-danger-50 border-danger-200 mb-6 rounded-xl border p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="text-danger-600 mr-3 h-5 w-5" />
                      <span className="text-danger-800 font-medium">{errors.privacy}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePrivacySettingsSubmit} className="space-y-8">
                  <Card className="bg-primary-10 border-primary-100 border shadow-none">
                    <CardBody className="p-6">
                      <div className="mb-6 flex items-start space-x-4">
                        <Mail className="text-primary-600 mt-1 h-6 w-6" />
                        <div>
                          <h4 className="text-default-900 mb-2 text-lg font-semibold">
                            Préférences de contact
                          </h4>
                          <p className="text-default-600 text-sm">
                            Choisissez comment vous souhaitez être contacté
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Checkbox
                            isSelected={privacySettings.acceptEmailContact}
                            onValueChange={(checked) =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                acceptEmailContact: checked as boolean,
                              }))
                            }
                            size="md"
                          >
                            <span className="text-default-700">
                              Accepter d'être contacté par email
                            </span>
                          </Checkbox>
                        </div>
                        <div>
                          <Checkbox
                            isSelected={privacySettings.acceptPhoneContact}
                            onValueChange={(checked) =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                acceptPhoneContact: checked as boolean,
                              }))
                            }
                            size="md"
                          >
                            <span className="text-default-700">
                              Accepter d'être contacté par téléphone
                            </span>
                          </Checkbox>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="bg-primary-10 border-primary-100 border shadow-none">
                    <CardBody className="p-6">
                      <div className="mb-6 flex items-start space-x-4">
                        <Eye className="text-secondary-600 mt-1 h-6 w-6" />
                        <div>
                          <h4 className="text-default-900 mb-2 text-lg font-semibold">
                            Visibilité des informations
                          </h4>
                          <p className="text-default-600 text-sm">
                            Contrôlez quelles informations sont visibles publiquement
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Checkbox
                            isSelected={privacySettings.displayEmail}
                            onValueChange={(checked) =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                displayEmail: checked as boolean,
                              }))
                            }
                            size="md"
                          >
                            <span className="text-default-700">
                              Afficher mon email sur mes annonces
                            </span>
                          </Checkbox>
                        </div>
                        <div>
                          <Checkbox
                            isSelected={privacySettings.displayPhone}
                            onValueChange={(checked) =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                displayPhone: checked as boolean,
                              }))
                            }
                            size="md"
                          >
                            <span className="text-default-700">
                              Afficher mon téléphone sur mes annonces
                            </span>
                          </Checkbox>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      isDisabled={saving}
                      color="primary"
                      size="lg"
                      radius="full"
                      className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                      isLoading={saving}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </Tab>

          <Tab
            key="security"
            title={
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-medium">Sécurité</span>
              </div>
            }
          >
            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="text-foreground pb-6">
                <div className="flex items-center gap-3">
                  <div className="from-success-100 to-success-200 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                    <ShieldCheck className="text-success-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-default-900 text-2xl font-bold">Sécurité</h3>
                    <p className="text-default-600">Gérez la sécurité de votre compte</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-8 pt-0">
                {messages.security && (
                  <div className="bg-primary-50 border-primary-200 rounded-xl border p-4">
                    <div className="flex items-center">
                      <CheckCircle className="text-success-600 mr-3 h-5 w-5" />
                      <span className="text-success-800 font-medium">{messages.security}</span>
                    </div>
                  </div>
                )}

                {errors.security && (
                  <div className="bg-danger-50 border-danger-200 rounded-xl border p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="text-danger-600 mr-3 h-5 w-5" />
                      <span className="text-danger-800 font-medium">{errors.security}</span>
                    </div>
                  </div>
                )}

                {/* Change Password Section */}
                <Card className="bg-primary-10 border-primary-100 border shadow-none">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Lock className="text-primary-600 h-6 w-6" />
                      <div>
                        <h4 className="text-default-900 text-lg font-semibold">
                          Changer le mot de passe
                        </h4>
                        <p className="text-default-600 text-sm">
                          Mettez à jour votre mot de passe pour sécuriser votre compte
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="pt-3">
                        <Input
                          type={showPasswords.current ? 'text' : 'password'}
                          label="Mot de passe actuel"
                          labelPlacement="outside"
                          value={securityInfo.currentPassword}
                          onChange={(e) =>
                            handleInputSecurityChange('currentPassword', e.target.value)
                          }
                          startContent={<Lock className="text-default-400 h-4 w-4" />}
                          size="md"
                          variant="bordered"
                          radius="lg"
                          endContent={
                            <button
                              type="button"
                              onPress={() =>
                                setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                              }
                              className="text-default-400 hover:text-default-600 transition-colors"
                            >
                              {showPasswords.current ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                          errorMessage={errorMessages.currentPassword}
                          isInvalid={errorMessages.currentPassword !== ''}
                          isRequired
                        />
                      </div>
                      <div className="pt-3">
                        <Input
                          type={showPasswords.new ? 'text' : 'password'}
                          label="Nouveau mot de passe"
                          labelPlacement="outside"
                          value={securityInfo.password}
                          onChange={(e) => handleInputSecurityChange('password', e.target.value)}
                          startContent={<Lock className="text-default-400 h-4 w-4" />}
                          size="md"
                          variant="bordered"
                          radius="lg"
                          endContent={
                            <button
                              type="button"
                              onPress={() =>
                                setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                              }
                              className="text-default-400 hover:text-default-600 transition-colors"
                            >
                              {showPasswords.new ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                          errorMessage={errorMessages.password}
                          isInvalid={errorMessages.password !== ''}
                          isRequired
                        />
                      </div>
                      <div className="pt-3">
                        <Input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          label="Confirmer le nouveau mot de passe"
                          labelPlacement="outside"
                          value={securityInfo.confirmPassword}
                          onChange={(e) =>
                            handleInputSecurityChange('confirmPassword', e.target.value)
                          }
                          startContent={<Lock className="text-default-400 h-4 w-4" />}
                          size="md"
                          variant="bordered"
                          radius="lg"
                          endContent={
                            <button
                              type="button"
                              onPress={() =>
                                setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                              }
                              className="text-default-400 hover:text-default-600 transition-colors"
                            >
                              {showPasswords.confirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                          errorMessage={errorMessages.confirmPassword}
                          isInvalid={errorMessages.confirmPassword !== ''}
                          isRequired
                        />
                      </div>

                      <div className="flex justify-center">
                        <Button
                          type="submit"
                          color="primary"
                          size="lg"
                          radius="full"
                          className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                          isDisabled={
                            saving ||
                            !securityInfo.currentPassword ||
                            !securityInfo.password ||
                            !securityInfo.confirmPassword
                          }
                          isLoading={saving}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {saving ? 'Modification...' : 'Changer le mot de passe'}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>

                {/* Change Email Section */}
                <Card className="bg-primary-10 border-primary-100 border shadow-none">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="text-secondary-600 h-6 w-6" />
                      <div>
                        <h4 className="text-default-900 text-lg font-semibold">
                          Changer l'adresse email{' '}
                          <span className="font-normal">{personalInfo.email}</span>
                        </h4>
                        <p className="text-default-600 text-sm">
                          Mettez à jour votre adresse email de connexion. Une confirmation sera
                          envoyée à la nouvelle adresse.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-6">
                      <Input
                        type="email"
                        labelPlacement="outside"
                        label="Nouvelle adresse email"
                        value={securityInfo.newEmail}
                        onChange={(e) => handleInputSecurityChange('newEmail', e.target.value)}
                        startContent={<Mail className="text-default-400 h-4 w-4" />}
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        errorMessage={errorMessages.newEmail}
                        isInvalid={errorMessages.newEmail !== ''}
                        isRequired
                      />

                      <div className="flex justify-center">
                        <Button
                          onPress={handleEmailChange}
                          color="secondary"
                          size="lg"
                          radius="full"
                          className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                          isDisabled={saving || !securityInfo.newEmail}
                          isLoading={saving}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {saving ? 'Envoi de la demande...' : 'Envoyer la demande'}
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Delete Account Section */}
                <Card className="bg-danger-10 border-danger-100 border shadow-none">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-danger-200 flex h-12 w-12 items-center justify-center rounded-xl">
                        <AlertTriangle className="text-danger-600 h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-danger-700 text-lg font-semibold">
                          Supprimer mon compte
                        </h4>
                        <p className="text-danger-600 text-sm">
                          {session?.user?.status === UserStatusEnum.attente_suppression
                            ? 'Demande de suppression en attente'
                            : 'Actions irréversibles sur votre compte'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {session?.user?.status === UserStatusEnum.attente_suppression ? (
                      <div className="space-y-6">
                        <div className="bg-warning-50 border-warning-200 rounded-lg border p-4">
                          <p className="text-warning-900 text-sm font-medium">
                            <AlertTriangle className="mr-2 inline-block h-4 w-4" />
                            Demande de suppression en cours
                          </p>
                          <p className="text-warning-800 mt-2 text-sm">
                            Votre demande de suppression de compte a été enregistrée. Votre compte
                            sera définitivement supprimé dans les prochains jours. Si vous changez
                            d'avis, vous pouvez annuler cette demande en cliquant sur le bouton
                            ci-dessous.
                          </p>
                        </div>

                        <div className="flex justify-center gap-3">
                          <Button
                            onPress={handleCancelDeleteRequest}
                            color="primary"
                            size="lg"
                            radius="full"
                            className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                            isDisabled={saving}
                            isLoading={saving}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {saving ? 'Annulation...' : 'Annuler la suppression'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-danger-50 border-danger-100 rounded-lg border p-4">
                          <p className="text-primary-900 text-sm font-medium">
                            <AlertTriangle className="mr-1 inline-block h-4 w-4" /> Attention :
                            Cette action est irréversible
                          </p>
                          <p className="text-primary-900 mt-2 text-sm">
                            La suppression de votre compte entraînera la perte définitive de toutes
                            vos données, y compris vos annonces, favoris et historique.
                          </p>
                        </div>
                        <p className="text-default-700 text-sm">
                          La suppression de votre compte est irréversible. Toutes vos données, y
                          compris vos annonces, seront définitivement supprimées.
                        </p>

                        <div className="flex justify-center">
                          <Button
                            onPress={handleOpenDeleteModal}
                            color="danger"
                            size="lg"
                            radius="full"
                            className="text-danger-900 bg-danger-100 border-danger-600 hover:border-danger hover:bg-danger border"
                            isDisabled={saving}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer mon compte
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        placement="center"
        size="2xl"
        isDismissable={!saving}
        hideCloseButton={saving}
      >
        <ModalContent className="bg-primary-50">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-danger-100 flex h-12 w-12 items-center justify-center rounded-xl">
                <AlertTriangle className="text-danger-600 h-6 w-6" />
              </div>
              <div>
                <h3 className="text-danger-700 text-xl font-bold">Supprimer mon compte</h3>
                <p className="text-danger-600 text-sm font-normal">Cette action est irréversible</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="border-danger-100 bg-danger-50/50 rounded-lg border p-4">
                <p className="text-danger-900 text-sm font-medium">
                  <AlertTriangle className="mr-2 inline-block h-4 w-4" />
                  Attention : La suppression de votre compte entraînera :
                </p>
                <ul className="text-danger-800 mt-2 ml-6 list-disc space-y-1 text-sm">
                  <li>La perte définitive de toutes vos données</li>
                  <li>La suppression de toutes vos annonces</li>
                  <li>La suppression de tous vos favoris</li>
                  <li>La perte de votre historique</li>
                </ul>
              </div>

              <div className="space-y-2 pt-5">
                <Input
                  value={deletionReason}
                  onChange={(e) => {
                    setDeletionReason(e.target.value);
                    setDeletionReasonError('');
                  }}
                  label="Pourquoi souhaitez-vous supprimer votre compte ?"
                  labelPlacement="outside"
                  size="lg"
                  placeholder="Veuillez nous indiquer la raison de votre départ (minimum 10 caractères)..."
                  disabled={saving}
                  isRequired
                />
                {deletionReasonError && (
                  <p className="text-danger-600 flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {deletionReasonError}
                  </p>
                )}
                <p className="text-default-500 text-xs">
                  Cette information nous aide à améliorer nos services.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseDeleteModal} isDisabled={saving}>
              Annuler
            </Button>
            <Button
              radius="full"
              onPress={handleDeleteAccount}
              isLoading={saving}
              isDisabled={saving || deletionReason.trim().length < 10}
              startContent={!saving && <Trash className="h-4 w-4" />}
              className="text-danger-900 bg-danger-100 border-danger-200 hover:border-danger hover:bg-danger border"
            >
              {saving ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
