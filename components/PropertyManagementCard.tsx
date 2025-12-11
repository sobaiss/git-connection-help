'use client';

import { Edit, Trash2, Ban, CheckCircle, ExternalLink } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  Property,
  PropertyDeleteableStatuses,
  PropertyDisactivableStatuses,
  PropertyEditableStatuses,
  PropertyStatusEnum,
  PropertyTransactionTypeEnum,
  RateTypeEnum,
} from '@/types/property';
import { deleteProperty, disableProperty } from '@/lib/actions/property';
import { MapPin, Building2 } from 'lucide-react';
import { propertyStatusesConfig, propertyTypesConfig } from '@/lib/config';
import { formatPrice } from '@/lib/utils/pricing';
import { getPropertyImagePath } from '@/lib/utils/image-path';

interface PropertyManagementCardProps {
  property: Property;
  imagesDomain: string;
  viewMode?: 'grid' | 'list';
  onPropertyChanged?: () => void;
}

export default function PropertyManagementCard({
  property,
  imagesDomain,
  onPropertyChanged,
}: PropertyManagementCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [clickedAction, setClickedAction] = useState<ActionEnum | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  enum ActionEnum {
    SET_RENTED = 'set-rented',
    SET_SOLD = 'set-sold',
    DELETE = 'delete',
    DISABLE = 'disable',
  }

  const actionsVerbs: Record<ActionEnum, string> = {
    [ActionEnum.SET_RENTED]: 'Déjà loué',
    [ActionEnum.SET_SOLD]: 'Déjà vendu',
    [ActionEnum.DELETE]: 'supprimer',
    [ActionEnum.DISABLE]: 'désactiver',
  };

  const questions: Record<ActionEnum, string> = {
    [ActionEnum.SET_RENTED]: 'Êtes-vous sûr de vouloir marquer cette annonce comme louée',
    [ActionEnum.SET_SOLD]: 'Êtes-vous sûr de vouloir marquer cette annonce comme vendue',
    [ActionEnum.DELETE]: 'Êtes-vous sûr de vouloir supprimer cette annonce',
    [ActionEnum.DISABLE]: 'Êtes-vous sûr de vouloir désactiver cette annonce',
  };

  const firstImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : {
          url: '/logo-gray-seloger-tchad.svg',
          alt: `${property.title} - Vue principale - ${property.location}`,
          id: 'placeholder',
          order: 0,
          createdAt: new Date(),
          propertyId: property.id,
        };

  if (firstImage.url.startsWith('http')) {
    // Already a full URL, use as-is
  } else if (firstImage.url.startsWith('/images/')) {
    // Already has full path, just prepend domain
    firstImage.url = `${imagesDomain}${firstImage.url}`;
  } else {
    // Relative path, build full URL
    firstImage.url = getPropertyImagePath(
      imagesDomain,
      firstImage.url,
      property.currentVersion?.id ?? property.id
    );
  }

  const altText =
    firstImage.alt ||
    `${property.title} - ${property.location} - ${property.transactionType === 'achat' ? 'À vendre' : 'À louer'}`;

  const propertyType = propertyTypesConfig.find((type) => type.value === property.propertyType);

  // Handle single property action button click
  const handleButtonActionClick = (action: ActionEnum) => {
    setClickedAction(action);
    setShowConfirmModal(true);
  };

  const handleSingleAction = async () => {
    setIsProcessing(true);

    try {
      let result;
      switch (clickedAction) {
        case ActionEnum.SET_RENTED:
        case ActionEnum.SET_SOLD:
        case ActionEnum.DISABLE:
          result = await disableProperty(property.id, clickedAction);
          break;
        case ActionEnum.DELETE:
          result = await deleteProperty(property.id);
          break;
      }

      if (result?.success) {
        addToast({
          title: 'Succès',
          description: result.message,
          color: 'success',
          timeout: 5000,
        });

        setTimeout(() => {
          onPropertyChanged?.();
        }, 1000);
      } else {
        addToast({
          title: 'Erreur',
          description: result?.message || 'Une erreur est survenue.',
          color: 'danger',
          timeout: 5000,
        });
      }
    } catch (error) {
      console.error('Error performing action:', error);
      addToast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        color: 'danger',
        timeout: 5000,
      });
    } finally {
      setIsProcessing(false);
      setClickedAction(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <Card className="group overflow-hidden bg-white shadow-sm transition-all duration-300">
        <CardBody className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-48 w-full flex-shrink-0 sm:h-auto sm:w-64">
              <Image
                src={firstImage.url}
                alt={altText}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 256px"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <Chip
                  size="sm"
                  className={`font-semibold bg-${propertyStatusesConfig.find((status) => status.value === property.status)?.color ?? 'white'}`}
                  variant="solid"
                >
                  {propertyStatusesConfig.find((status) => status.value === property.status)?.label}
                </Chip>
              </div>
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                <Button
                  as={Link}
                  href={`/mon-compte/mon-annonce/${property.id}`}
                  target="_blank"
                  variant="bordered"
                  radius="full"
                  color="primary"
                  size="sm"
                  endContent={<ExternalLink className="h-4 w-4" />}
                  className="hover:text-primary-800 border-none bg-transparent bg-white/60 text-gray-900 hover:bg-white"
                >
                  <span className="hover:text-primary-800 text-xs text-gray-900">
                    Voir l'annonce
                  </span>
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-start gap-2">
                  <h3 className="text-default-900 line-clamp-2 flex-1 text-xl font-bold">
                    {property.title}
                  </h3>
                  {property.nextVersionId && (
                    <span className="pl-2">
                      <Button
                        as={Link}
                        href={`/mon-compte/mon-annonce/${property.nextVersionId}`}
                        target="_blank"
                        variant="bordered"
                        radius="full"
                        color="primary"
                        size="sm"
                        endContent={<ExternalLink className="h-4 w-4" />}
                        className="hover:bg-primary-300 border-none bg-gray-100 text-gray-900"
                      >
                        Voir la version non publiée
                      </Button>
                    </span>
                  )}
                  {property.currentVersion?.id && (
                    <span className="pl-2">
                      <Button
                        as={Link}
                        href={`/annonce/${property.currentVersion.id}`}
                        target="_blank"
                        variant="bordered"
                        radius="full"
                        color="primary"
                        size="sm"
                        endContent={<ExternalLink className="h-4 w-4" />}
                        className="hover:bg-primary-300 border-none bg-gray-100 text-gray-900"
                      >
                        Voir la version publiée
                      </Button>
                    </span>
                  )}
                </div>

                <div className="text-default-600 mb-2 flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span className="text-sm">{property.location}</span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <Building2 className="text-default-600 h-4 w-4" />
                  <span className="text-default-600 text-sm">
                    {propertyType?.label} en{' '}
                    {property.transactionType === 'achat' ? 'vente' : 'location'}
                  </span>
                </div>

                <div className="mb-4 text-lg text-emerald-700">
                  <span className="font-bold">{formatPrice(property.price)}</span>
                  {property.rate && property.rate !== RateTypeEnum.unique && (
                    <span className="text-gray-500"> / {property.rate}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {PropertyEditableStatuses.includes(property.status) && (
                  <Button
                    as={Link}
                    href={`/mon-compte/modifier-une-annonce/${property.nextVersionId ?? property.id}`}
                    target="_blank"
                    isIconOnly
                    variant="flat"
                    radius="full"
                    color="primary"
                    size="md"
                    className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {PropertyDeleteableStatuses.includes(property.status) && (
                  <Button
                    onPress={() => handleButtonActionClick(ActionEnum.DELETE)}
                    isIconOnly
                    variant="flat"
                    radius="full"
                    color="danger"
                    size="md"
                    className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {PropertyDisactivableStatuses.includes(property.status) &&
                  property.versionTag === 'main' && (
                    <Button
                      variant="flat"
                      color="warning"
                      radius="full"
                      size="md"
                      className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                      startContent={<Ban className="h-4 w-4" />}
                      onPress={() => handleButtonActionClick(ActionEnum.DISABLE)}
                    >
                      Désactiver
                    </Button>
                  )}
                {property.transactionType === PropertyTransactionTypeEnum.achat &&
                  property.status === PropertyStatusEnum.disponible && (
                    <Button
                      variant="flat"
                      color="secondary"
                      radius="full"
                      size="md"
                      className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                      startContent={<CheckCircle className="h-4 w-4" />}
                      onPress={() => handleButtonActionClick(ActionEnum.SET_SOLD)}
                    >
                      Déjà vendu
                    </Button>
                  )}
                {property.transactionType === PropertyTransactionTypeEnum.location &&
                  property.status === PropertyStatusEnum.disponible && (
                    <Button
                      variant="flat"
                      color="secondary"
                      radius="full"
                      size="md"
                      className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                      startContent={<CheckCircle className="h-4 w-4" />}
                      onPress={() => handleButtonActionClick(ActionEnum.SET_RENTED)}
                    >
                      Déjà loué
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <ModalContent>
          <ModalHeader className="capitalize">
            {clickedAction && actionsVerbs[clickedAction]} une annonce
          </ModalHeader>
          <ModalBody>
            <p>{clickedAction && questions[clickedAction]} ?</p>
            <p className="text-sm font-bold text-emerald-700">{property.title}</p>
            <div className="mb-4 flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-emerald-600" />
              <span className="text-default-800 text-sm">{property.location}</span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              radius="full"
              variant="bordered"
              className="border-default-800 hover:bg-default-800 border text-gray-900"
              onPress={() => setShowConfirmModal(false)}
            >
              Annuler
            </Button>
            <Button
              color="success"
              radius="full"
              onPress={() => handleSingleAction()}
              isLoading={isProcessing}
            >
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
