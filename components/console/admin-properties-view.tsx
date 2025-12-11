'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  MapPin,
  Building2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  Button,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Pagination,
  Input,
  Checkbox,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  Property,
  PropertyDeleteableStatuses,
  PropertyDisactivableStatuses,
  PropertyStatusEnum,
} from '@/types/property';
import {
  ITEMS_PER_PAGE,
  propertyTypesConfig,
  propertyStatusesConfig,
  sortOptionsConfig,
  PropertySortFieldEnum,
  SortOrderEnum,
  propertyTypesIconMap,
  CONSOLE_ITEMS_PER_PAGE,
} from '@/lib/config';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatPrice } from '@/lib/utils/pricing';
import {
  disableProperty,
  getConsoleProperties,
  rejectProperty,
  softRemoveProperty,
  validateProperty,
} from '@/lib/actions/console';

export default function AdminPropertiesView({ imagesDomain }: { imagesDomain: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isFetchingRef = useRef(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1') || 1);
  const [limit, setLimit] = useState(
    parseInt(searchParams.get('limit') || CONSOLE_ITEMS_PER_PAGE.toString()) ||
      CONSOLE_ITEMS_PER_PAGE
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') ?? PropertyStatusEnum.attente_validation
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'updatedAt_desc');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [total, setTotal] = useState(0);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [clickedProperty, setClickedProperty] = useState<{
    id: string;
    action: ActionEnum;
    property: Property;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [selectedBulkAction, setSelectedBulkAction] = useState<ActionEnum | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  enum ActionEnum {
    VALIDATE = 'validate',
    REJECT = 'reject',
    DELETE = 'delete',
    DISABLE = 'disable',
  }

  const actionsVerbs: Record<ActionEnum, string> = {
    [ActionEnum.VALIDATE]: 'valider',
    [ActionEnum.REJECT]: 'refuser',
    [ActionEnum.DELETE]: 'supprimer',
    [ActionEnum.DISABLE]: 'désactiver',
  };

  const questions: Record<ActionEnum, string> = {
    [ActionEnum.VALIDATE]: 'Êtes-vous sûr de vouloir valider cette annonce',
    [ActionEnum.REJECT]: 'Êtes-vous sûr de vouloir rejeter cette annonce',
    [ActionEnum.DELETE]: 'Êtes-vous sûr de vouloir supprimer cette annonce',
    [ActionEnum.DISABLE]: 'Êtes-vous sûr de vouloir désactiver cette annonce',
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.push('/auth/signin');
    }
  }, [status, router]);

  /**
   * Create query string for URL based on current filters and pagination.
   * @returns string
   */
  // 1. Memoize createQueryString
  const createQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set('page', page.toString());
    }
    if (limit !== ITEMS_PER_PAGE) {
      params.set('limit', limit.toString());
    }
    params.set('sortBy', sortBy);
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (statusFilter) {
      params.set('status', statusFilter);
    }

    return params.toString();
  }, [page, limit, sortBy, searchQuery, statusFilter]);

  /**
   * Fetch properties based on current filters and pagination.
   * @returns
   */
  // 2. Memoize fetchProperties
  const fetchProperties = useCallback(async () => {
    try {
      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);

      const selectedSort = sortOptionsConfig.find((opt) => opt.value === sortBy);
      const sortField = selectedSort?.field || PropertySortFieldEnum.CREATED_AT;
      const sortOrder = selectedSort?.order || SortOrderEnum.DESC;

      const filters: any = {
        search: deferredSearchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : '*',
      };

      const result = await getConsoleProperties({
        filters,
        page,
        limit,
        sortBy: sortField,
        sortOrder,
      });

      if (result) {
        setProperties(result.properties || []);
        setTotal(result.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      addToast({
        title: 'Erreur',
        description: 'Impossible de charger les annonces.',
        color: 'danger',
        timeout: 5000,
      });
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy, page, limit]);

  // 3. Initialize from URL only once
  useEffect(() => {
    const searchPage = searchParams.get('page');
    if (searchPage) {
      setPage(parseInt(searchPage) || 1);
    }
    const searchLimit = searchParams.get('limit');
    if (searchLimit) {
      setLimit(parseInt(searchLimit) || ITEMS_PER_PAGE);
    }
    const searchSortBy = searchParams.get('sortBy');
    if (searchSortBy) {
      setSortBy(searchSortBy);
    }
    const searchStatus = searchParams.get('status');
    if (searchStatus) {
      setStatusFilter(searchStatus);
    }
    const searchQueryParam = searchParams.get('search');
    if (searchQueryParam) {
      setSearchQuery(searchQueryParam);
    }

    setIsInitialized(true);
  }, []);

  // 4. Update URL when filters change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      router.push(pathname + '?' + createQueryString(), { scroll: false });
    }
  }, [isInitialized, createQueryString, router, pathname]);

  // 5. Fetch data with debounce
  useEffect(() => {
    if (!isInitialized) return;

    const debounceTimer = setTimeout(() => {
      fetchProperties();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [isInitialized, fetchProperties]);

  const handleBulkAction = async (action: ActionEnum) => {
    if (selectedProperties.size === 0) {
      addToast({
        title: 'Attention',
        description: 'Veuillez sélectionner au moins une annonce.',
        color: 'warning',
        timeout: 5000,
      });
      return;
    }

    setIsProcessing(true);
    const propertyIds = Array.from(selectedProperties);

    try {
      //Handle bulk actions in promise.allSettled
      const results = await Promise.allSettled(
        propertyIds.map(async (propertyId) => {
          switch (action) {
            case ActionEnum.VALIDATE:
              return await validateProperty(propertyId);
            case ActionEnum.REJECT:
              return await rejectProperty(propertyId);
            case ActionEnum.DISABLE:
              return await disableProperty(propertyId);
            case ActionEnum.DELETE:
              return await softRemoveProperty(propertyId);
          }
        })
      );

      // Check if all actions were successful
      const allSuccessful = results.every(
        (res) => res.status === 'fulfilled' && res.value?.success
      );

      if (allSuccessful) {
        addToast({
          title: 'Succès',
          description: `Action ${actionsVerbs[selectedBulkAction!]} en masse effectuée avec succès!`,
          color: 'success',
          timeout: 5000,
        });

        setTimeout(() => {
          fetchProperties();
        }, 1000);
      } else {
        addToast({
          title: 'Erreur',
          description: `Une erreur est survenue lors de l'action ${actionsVerbs[selectedBulkAction!]} en masse.`,
          color: 'danger',
          timeout: 5000,
        });
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      addToast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        color: 'danger',
        timeout: 5000,
      });
    } finally {
      setIsProcessing(false);
      setSelectedProperties(new Set());
      setSelectedBulkAction(null);
      setShowBulkConfirmModal(false);
    }
  };

  // Handle bulk action selection from dropdown
  const handleBulkActionSelected = (action: ActionEnum) => {
    setSelectedBulkAction(action);
    setShowBulkConfirmModal(true);
  };

  // Handle single property action button click
  const handleButtonActionClick = (id: string, action: ActionEnum) => {
    const property = properties.find((prop) => prop.id === id)!;
    setClickedProperty({ id, action, property });
    setShowConfirmModal(true);
  };

  const handleSingleAction = async (propertyId: string, action: ActionEnum) => {
    setIsProcessing(true);

    try {
      let result;
      switch (action) {
        case ActionEnum.VALIDATE:
          result = await validateProperty(propertyId);
          break;
        case ActionEnum.REJECT:
          result = await rejectProperty(propertyId);
          break;
        case ActionEnum.DISABLE:
          result = await disableProperty(propertyId);
          break;
        case ActionEnum.DELETE:
          result = await softRemoveProperty(propertyId);
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
          fetchProperties();
        }, 300);
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
      setClickedProperty(null);
      setShowConfirmModal(false);
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const handleStatusFilterChange = (keys: any) => {
    const value = Array.from(keys)[0] as string;
    setPage(1);
    setStatusFilter(value || 'all');
  };

  const handleSortByChange = (keys: any) => {
    const value = Array.from(keys)[0] as string;
    setSortBy(value || 'updatedAt_desc');
  };

  const pages = Math.ceil(total / limit);

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <Card className="bg-white shadow-none">
          <CardHeader className="flex-col items-start px-6 pt-6 pb-0">
            <div className="flex w-full items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Console Admin - Annonces</h1>
                <p className="text-default-500 mt-1 text-sm">
                  Gérez toutes les annonces de la plateforme
                </p>
              </div>
            </div>

            <div className="mt-6 flex w-full flex-col gap-4 sm:flex-row">
              <Input
                placeholder="Rechercher une annonce..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search className="text-default-400 h-4 w-4" />}
                className="flex-1"
                aria-label="Rechercher une annonce"
                isClearable
              />
              <Select
                placeholder="Statut"
                selectedKeys={[statusFilter]}
                onSelectionChange={handleStatusFilterChange}
                className="w-full sm:w-48"
                aria-label="Filtrer par statut"
              >
                <SelectItem key="all">Tous les statuts</SelectItem>
                <>
                  {propertyStatusesConfig.map((status) => (
                    <SelectItem key={status.value}>{status.label}</SelectItem>
                  ))}
                </>
              </Select>
              <Select
                placeholder="Trier par"
                selectedKeys={[sortBy]}
                onSelectionChange={handleSortByChange}
                className="w-full sm:w-48"
                aria-label="Trier par"
              >
                <>
                  {sortOptionsConfig.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </>
              </Select>
            </div>

            {selectedProperties.size > 0 && (
              <div className="mt-4 flex w-full flex-wrap gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      size="md"
                      variant="bordered"
                      color="secondary"
                      endContent={<ChevronDown className="h-4 w-4" />}
                      isDisabled={selectedProperties.size === 0 || isProcessing}
                      radius="full"
                    >
                      Actions ({selectedProperties.size})
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Actions sur les propriétés sélectionnées"
                    color="secondary"
                    variant="shadow"
                  >
                    <DropdownItem
                      key="sold"
                      startContent={<CheckCircle className="h-4 w-4" />}
                      color="success"
                      onPress={() => handleBulkActionSelected(ActionEnum.VALIDATE)}
                      className="capitalize"
                    >
                      {actionsVerbs[ActionEnum.VALIDATE]}
                    </DropdownItem>
                    <DropdownItem
                      key="rented"
                      startContent={<CheckCircle className="h-4 w-4" />}
                      color="success"
                      onPress={() => handleBulkActionSelected(ActionEnum.REJECT)}
                      className="capitalize"
                    >
                      {actionsVerbs[ActionEnum.REJECT]}
                    </DropdownItem>
                    <DropdownItem
                      key="deactivate"
                      startContent={<Ban className="h-4 w-4" />}
                      color="warning"
                      onPress={() => handleBulkActionSelected(ActionEnum.DISABLE)}
                      className="capitalize"
                    >
                      {actionsVerbs[ActionEnum.DISABLE]}
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      startContent={<Trash2 className="h-4 w-4" />}
                      color="danger"
                      onPress={() => handleBulkActionSelected(ActionEnum.DELETE)}
                      className="capitalize"
                    >
                      {actionsVerbs[ActionEnum.DELETE]}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            )}
          </CardHeader>

          <CardBody className="px-6 py-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <p>Chargement...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-default-500">Aucune annonce trouvée</p>
              </div>
            ) : (
              <Table
                aria-label="Tableau des annonces"
                classNames={{
                  wrapper: 'shadow-none bg-transparent',
                }}
              >
                <TableHeader>
                  <TableColumn width={50}>#</TableColumn>
                  <TableColumn>ANNONCE</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>PRIX</TableColumn>
                  <TableColumn>PROPRIÉTAIRE</TableColumn>
                  <TableColumn>STATUT</TableColumn>
                  <TableColumn>DATE MAJ</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => {
                    const propertyStatus = propertyStatusesConfig.find(
                      (s) => s.value === property.status
                    );
                    const Icon = propertyTypesIconMap[property.propertyType] || MapPin;
                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <Checkbox
                            aria-label={`Sélectionner l'annonce ${property.title}`}
                            size="md"
                            isSelected={selectedProperties.has(property.id)}
                            onValueChange={() => handleSelectProperty(property.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Icon className="text-default-400 h-5 w-5 flex-shrink-0" />
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold">
                                <Link
                                  href={`/console/annonce/${property.id}`}
                                  target="_blank"
                                  className="flex items-center gap-1 hover:underline"
                                >
                                  {property.title}
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </p>
                              <p className="text-default-500 flex items-center gap-1 text-xs">
                                <MapPin className="h-3 w-3" />
                                {property.location}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="capitalize">
                              {
                                propertyTypesConfig.find((t) => t.value === property.propertyType)
                                  ?.label
                              }
                            </p>
                            <p className="text-default-500 text-xs">
                              {property.transactionType === 'achat' ? 'Vente' : 'Location'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold">{formatPrice(property.price)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {property.agency ? (
                              <>
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm">{property.agency.name}</span>
                              </>
                            ) : (
                              <span className="text-sm">
                                {property.owner?.firstName} {property.owner?.lastName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {propertyStatus && (
                            <Chip
                              className={`bg-${propertyStatus.color} text-xs text-emerald-900`}
                              size="sm"
                              variant="flat"
                            >
                              {propertyStatus.label}
                            </Chip>
                          )}
                        </TableCell>
                        <TableCell>
                          {property.updatedAt
                            ? new Date(property.updatedAt).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {property.status === PropertyStatusEnum.attente_validation && (
                              <>
                                <Tooltip content="Valider et publier l'annonce">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="success"
                                    isIconOnly
                                    onPress={() =>
                                      handleButtonActionClick(property.id, ActionEnum.VALIDATE)
                                    }
                                    className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                                    isDisabled={isProcessing}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Refuser l'annonce">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    isIconOnly
                                    onPress={() =>
                                      handleButtonActionClick(property.id, ActionEnum.REJECT)
                                    }
                                    className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                                    isDisabled={isProcessing}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </Tooltip>
                              </>
                            )}
                            {PropertyDisactivableStatuses.includes(property.status) &&
                              property.versionTag === 'main' && (
                                <Tooltip content="Désactiver l'annonce">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="warning"
                                    isIconOnly
                                    onPress={() =>
                                      handleButtonActionClick(property.id, ActionEnum.DISABLE)
                                    }
                                    isDisabled={isProcessing}
                                    className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </Tooltip>
                              )}
                            {PropertyDeleteableStatuses.includes(property.status) && (
                              <Tooltip content="Supprimer l'annonce">
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  isIconOnly
                                  onPress={() =>
                                    handleButtonActionClick(property.id, ActionEnum.DELETE)
                                  }
                                  className="hover:bg-primary-300 bg-gray-100 text-gray-900"
                                  isDisabled={isProcessing}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {pages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  total={pages}
                  page={page}
                  onChange={(newPage) => setPage(newPage)}
                  showControls
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <ModalContent>
          <ModalHeader className="capitalize">
            {actionsVerbs[clickedProperty?.action!]} une annonce
          </ModalHeader>
          <ModalBody>
            <p>{questions[clickedProperty?.action!]} ?</p>
            <p className="text-sm font-bold text-emerald-700">{clickedProperty?.property.title}</p>
            <div className="mb-4 flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-emerald-600" />
              <span className="text-default-800 text-sm">{clickedProperty?.property.location}</span>
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
              onPress={() => handleSingleAction(clickedProperty!.id, clickedProperty!.action)}
              isLoading={isProcessing}
            >
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={showBulkConfirmModal} onOpenChange={setShowBulkConfirmModal}>
        <ModalContent>
          <ModalHeader className="capitalize">
            {actionsVerbs[selectedBulkAction!]} les annonces
          </ModalHeader>
          <ModalBody>
            <p>{questions[selectedBulkAction!]} ?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              radius="full"
              variant="bordered"
              className="border-default-800 hover:bg-default-800 border text-gray-900"
              onPress={() => setShowBulkConfirmModal(false)}
            >
              Annuler
            </Button>
            <Button
              color="success"
              radius="full"
              onPress={() => handleBulkAction(selectedBulkAction!)}
              isLoading={isProcessing}
            >
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
