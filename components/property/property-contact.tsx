'use client';

import { MapPin, Phone, MailIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { User, UserTypeEnum } from '@/types/user';
import { sendMessage } from '@/lib/actions/property';
import { useSession } from 'next-auth/react';
import { PropertyDetailsSkeleton } from './skeletons';
import { getUserAvatarPath } from '@/lib/utils/image-path';
import { getUser } from '@/lib/actions/user';
import { addToast } from '@heroui/toast';
import { Avatar, Button, Card, CardBody, Divider, Input, Textarea } from '@heroui/react';
import { getAgency } from '@/lib/actions/agency';
import { Property } from '@/types/property';
import { Agency } from '@/types/agency';

export default function PropertyContactView({
  property,
  imagesDomain,
}: {
  property: Property;
  imagesDomain: string;
}) {
  const [contact, setContact] = useState<User | null>(property.owner || null);
  const [agency, setAgency] = useState<Agency | null>(property.agency || null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [showContactPhone, setShowContactPhone] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFetchingContactRef = useRef(false);
  const isFetchingAgencyRef = useRef(false);
  const [errorMessages, setErrorMessages] = useState({
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    message: "Votre annonce m'intéresse. Merci de me contacter pour convenir d'une visite.",
  });

  const fetchContact = useCallback(async () => {
    if (!property.ownerId) {
      return;
    }
    // Prevent concurrent fetches
    if (isFetchingContactRef.current) {
      return;
    }

    isFetchingContactRef.current = true;
    setIsLoading(true);

    try {
      const user = (await getUser(property.ownerId)) as User | null;
      if (!user) {
        setIsLoading(false);
        return;
      }

      setContact(user);
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setIsLoading(false);
    }
  }, [property.ownerId]);

  const fetchAgency = useCallback(async () => {
    if (!property.agencyId) {
      return;
    }
    // Prevent concurrent fetches
    if (isFetchingAgencyRef.current) {
      return;
    }

    isFetchingAgencyRef.current = true;
    setIsLoading(true);

    try {
      const agency = await getAgency(property.agencyId);
      if (!agency) {
        setIsLoading(false);
        return;
      }

      setAgency(agency);
    } catch (error) {
      console.error('Error fetching agency:', error);
    } finally {
      setIsLoading(false);
    }
  }, [property.ownerId]);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchContact(), fetchAgency()]);
    };
    fetchData();
  }, [fetchContact]);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        lastName: session.user.lastName || '',
        firstName: session.user.firstName || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
      }));
    }
  }, [session]);

  function handleShowPhoneNumber(): void {
    setShowContactPhone((prev) => !prev);
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessages((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmitMessage = async () => {
    if (!contact) return;

    setIsSubmitting(true);
    setErrorMessages({
      lastName: '',
      email: '',
      phone: '',
      message: '',
    });

    try {
      const result = await sendMessage({
        propertyId: property.id,
        lastName: formData.lastName,
        firstName: formData.firstName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      if ('errors' in result && result.errors) {
        const errors = {
          lastName: '',
          email: '',
          phone: '',
          message: '',
        };

        for (const [field, messages] of Object.entries(result.errors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            errors[field as keyof typeof errors] = messages[0];
          }
        }

        setErrorMessages(errors);

        addToast({
          title: 'Erreur de validation',
          description: result.message,
          color: 'danger',
          timeout: 5000,
        });
        return;
      }

      if (result.success) {
        addToast({
          title: 'Succès',
          description: result.message,
          color: 'success',
          timeout: 5000,
        });

        setFormData({
          lastName: '',
          firstName: '',
          email: '',
          phone: '',
          message: "Votre annonce m'intéresse. Merci de me contacter pour convenir d'une visite.",
        });

        setShowContactForm(false);
      } else {
        addToast({
          title: 'Erreur',
          description: result.message,
          color: 'danger',
          timeout: 5000,
        });
      }
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        color: 'danger',
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  if (!contact) {
    return null;
  }

  return (
    <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-none">
      <CardBody className="p-6">
        <div className="space-y-6">
          {/* Agent/Agency Info */}
          <div className="flex items-center gap-4">
            <Avatar
              src={(() => {
                const imgUrl = agency?.logo ?? contact.image;
                if (!imgUrl) return undefined;
                if (imgUrl.startsWith('http')) return imgUrl;
                if (imgUrl.startsWith('/images/')) return `${imagesDomain}${imgUrl}`;
                if (agency?.logo) return `${imagesDomain}/images/agencies/${agency.id}/${imgUrl}`;
                return getUserAvatarPath(imagesDomain, imgUrl, contact.id || '');
              })()}
              name={agency?.name ?? `${contact.firstName} ${contact.lastName}`}
              size="lg"
              className="h-16 w-16 flex-shrink-0 text-lg"
              showFallback
            />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 truncate text-lg font-bold">
                {agency?.name ?? `${contact.firstName} ${contact.lastName}`}
              </h3>
              <p className="text-sm text-emerald-600">
                {agency
                  ? 'Agence Immobilière'
                  : contact.userType === UserTypeEnum.professionnel
                    ? 'Agent Immobilier'
                    : 'Particulier'}
              </p>
              {(agency?.location || contact.location) && (
                <div className="mb-4 flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-emerald-600" />{' '}
                  <span className="text-default-800 text-sm">
                    {agency?.location ?? contact.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Buttons */}
          {contact.settings?.displayPhone && contact.settings?.acceptPhoneContact && (
            <div className="space-y-3 text-center">
              <Button
                variant="bordered"
                radius="full"
                className={
                  showContactPhone
                    ? 'border-warning-500 bg-warning-500 text-primary-900 w-full border font-semibold'
                    : 'border-default-600 w-full border font-semibold hover:border-emerald-200 hover:bg-emerald-100'
                }
                onPress={handleShowPhoneNumber}
              >
                <Phone className="mr-2 h-5 w-5 text-emerald-600" />
                {showContactPhone ? property.contact?.phone || contact.phone : 'Afficher le numéro'}
              </Button>
            </div>
          )}

          <Divider />
          <div className="space-y-3 text-center">
            <h4 className="text-lg font-bold text-emerald-600">Cette annonce vous intéresse ?</h4>
            <p className="mt-xs text-sm">
              Contactez vite{' '}
              {contact.userType === UserTypeEnum.professionnel ? "l'agence" : 'le propriétaire'}{' '}
              pour le visiter !
            </p>
          </div>

          {/* Toggle Contact Form Button */}
          {contact.settings?.acceptEmailContact &&
            !showContactForm &&
            session?.user?.id !== contact.id && (
              <Button
                variant="bordered"
                radius="full"
                className="border-default-600 w-full border font-semibold hover:border-emerald-200 hover:bg-emerald-100"
                onPress={() => setShowContactForm(true)}
                aria-label="Afficher le formulaire de contact"
              >
                <MailIcon className="mr-2 h-5 w-5 text-emerald-600" />
                Envoyer un message
              </Button>
            )}

          {/* Contact Form */}
          {showContactForm && session?.user?.id !== contact.id && (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-3 overflow-hidden duration-300">
              <Input
                label="Nom"
                labelPlacement="outside"
                placeholder="Nom"
                variant="bordered"
                isRequired
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                isInvalid={!!errorMessages.lastName}
                errorMessage={errorMessages.lastName}
                isReadOnly={!!session?.user?.lastName}
              />
              <Input
                label="Prénom"
                labelPlacement="outside"
                placeholder="Prénom"
                variant="bordered"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                isReadOnly={!!session?.user?.firstName}
                className="pt-3"
              />
              <Input
                label="Email"
                labelPlacement="outside"
                placeholder="Email"
                type="email"
                variant="bordered"
                isRequired
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                isInvalid={!!errorMessages.email}
                errorMessage={errorMessages.email}
                isReadOnly={!!session?.user?.email}
                className="pt-3"
              />
              <Input
                label="Téléphone"
                labelPlacement="outside"
                placeholder="Téléphone"
                type="tel"
                variant="bordered"
                isRequired
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                isInvalid={!!errorMessages.phone}
                errorMessage={errorMessages.phone}
                isReadOnly={!!session?.user?.phone}
                className="pt-3"
              />
              <Textarea
                label="Message"
                labelPlacement="outside"
                placeholder="Votre message"
                minRows={3}
                variant="bordered"
                maxLength={500}
                isRequired
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                isInvalid={!!errorMessages.message}
                errorMessage={errorMessages.message}
              />
              <Button
                color="primary"
                className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                radius="full"
                onPress={handleSubmitMessage}
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
                aria-label="Envoyer le message"
              >
                <MailIcon className="mr-2 h-5 w-5" />
                Envoyer
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
