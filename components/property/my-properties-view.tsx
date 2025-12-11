'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Trash2, Ban, CheckCircle, ChevronDown, MapPin, Building2 } from 'lucide-react';
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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from '@heroui/react';
import PropertyManagementCard from '@/components/PropertyManagementCard';
import PropertyManagementSkeleton from './property-management-skeleton';
import { Property } from '@/types/property';
import { deleteProperty, disableProperty } from '@/lib/actions/property';
import {
  sortOptionsConfig,
  propertyTypesConfig,
  propertyStatusesConfig,
  allPropertyTransactionTypes,
  CONSOLE_ITEMS_PER_PAGE,
} from '@/lib/config';
import { signOut, useSession } from 'next-auth/react';
import { User } from 'next-auth';
import { getUserProperties, UserPropertyFilters } from '@/lib/actions/user';

export default function MyPropertiesView({ imagesDomain }: { imagesDomain: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isFetchingRef = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1') || 1);
  const [limit, setLimit] = useState(
    parseInt(searchParams.get('limit') || CONSOLE_ITEMS_PER_PAGE.toString()) ||
      CONSOLE_ITEMS_PER_PAGE
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'updatedAt_desc');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(
    new Set(searchParams.get('status')?.split(',') || ['all'])
  );
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<Set<string>>(
    new Set(searchParams.get('propertyType')?.split(',') || ['all'])
  );
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>(
    searchParams.get('transactionType') || 'all'
  );

  const [total, setTotal] = useState(0);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [selectedBulkAction, setSelectedBulkAction] = useState<ActionEnum | null>(null);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  //@todo refactor to single enum file
  enum ActionEnum {
    SET_RENTED = 'set-rented',
    SET_SOLD = 'set-sold',
    DELETE = 'delete',
    DISABLE = 'disable',
  }

  const actionsVerbs: Record<ActionEnum, string> = {
    [ActionEnum.SET_RENTED]: 'Marquer comme loué',
    [ActionEnum.SET_SOLD]: 'Marquer comme vendu',
    [ActionEnum.DELETE]: 'supprimer',
    [ActionEnum.DISABLE]: 'désactiver',
  };

  const questions: Record<ActionEnum, string> = {
    [ActionEnum.SET_RENTED]: 'Êtes-vous sûr de vouloir marquer cette annonce comme louée',
    [ActionEnum.SET_SOLD]: 'Êtes-vous sûr de vouloir marquer cette annonce comme vendue',
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
  const createQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set('page', page.toString());
    }
    if (limit !== CONSOLE_ITEMS_PER_PAGE) {
      params.set('limit', limit.toString());
    }
    params.set('sortBy', sortBy);
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (statusFilter) {
      params.set('status', Array.from(statusFilter).join(','));
    }
    if (propertyTypeFilter) {
      params.set('propertyType', Array.from(propertyTypeFilter).join(','));
    }
    if (transactionTypeFilter && transactionTypeFilter !== 'all') {
      params.set('transactionType', transactionTypeFilter);
    }

    return params.toString();
  }, [page, limit, sortBy, searchQuery, statusFilter, propertyTypeFilter, transactionTypeFilter]);

  // Fetch user properties based on current filters and pagination
  const fetchProperties = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const statusArray = Array.from(statusFilter);
      const propertyTypeArray = Array.from(propertyTypeFilter);
      const hasAllStatus = statusArray.includes('all');
      const hasAllPropertyType = propertyTypeArray.includes('all');

      const filters: UserPropertyFilters = {
        search: searchQuery || undefined,
        status: !hasAllStatus && statusArray.length > 0 ? statusArray.join(',') : undefined,
        propertyTypes:
          !hasAllPropertyType && propertyTypeArray.length > 0
            ? propertyTypeArray.join(',')
            : undefined,
        transactionType: transactionTypeFilter !== 'all' ? transactionTypeFilter : undefined,
      };

      const sortOption = sortOptionsConfig.find((option) => option.value === sortBy);
      const response = await getUserProperties({
        filters,
        page,
        limit,
        sortBy: sortOption?.field,
        sortOrder: sortOption?.order,
      });

      setProperties(response?.properties || []);
      setTotal(response?.pagination.total || 0);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setTotal(0);
      // Handle unauthorized error by signing out
      if (error instanceof Error && error.message === 'Unauthorized') {
        addToast({
          title: 'Session expirée',
          description: 'Veuillez vous reconnecter pour continuer.',
          color: 'danger',
          timeout: 3000,
        });

        setTimeout(() => {
          signOut({
            callbackUrl: '/auth/signin',
          });
        }, 3000);
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [searchQuery, statusFilter, propertyTypeFilter, transactionTypeFilter, sortBy, page, limit]);

  // Initialize state from URL query parameters
  useEffect(() => {
    const searchPage = searchParams.get('page');
    if (searchPage) {
      setPage(parseInt(searchPage) || 1);
    }
    const searchLimit = searchParams.get('limit');
    if (searchLimit) {
      setLimit(parseInt(searchLimit) || CONSOLE_ITEMS_PER_PAGE);
    }
    const searchSortBy = searchParams.get('sortBy');
    if (searchSortBy) {
      setSortBy(searchSortBy);
    }
    const searchStatus = searchParams.get('status');
    if (searchStatus) {
      setStatusFilter(new Set(searchStatus.split(',')));
    }
    const searchQueryParam = searchParams.get('search');
    if (searchQueryParam) {
      setSearchQuery(searchQueryParam);
    }
    const searchPropertyType = searchParams.get('propertyType');
    if (searchPropertyType) {
      setPropertyTypeFilter(new Set(searchPropertyType.split(',')));
    }
    const searchTransactionType = searchParams.get('transactionType');
    if (searchTransactionType) {
      setTransactionTypeFilter(searchTransactionType);
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

  // Handle scroll event to add shadow to sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 335) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle property changes (e.g., after edit)
  const handlePropertyChanged = () => {
    fetchProperties();
    setSelectedProperties(new Set());
  };

  // Handle select all properties
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(new Set(properties.map((p) => p.id)));
    } else {
      setSelectedProperties(new Set());
    }
  };

  // Handle individual property selection
  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    const newSelected = new Set(selectedProperties);
    if (checked) {
      newSelected.add(propertyId);
    } else {
      newSelected.delete(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  // Handle bulk action selection from dropdown
  const handleBulkActionSelected = (action: ActionEnum) => {
    setSelectedBulkAction(action);
    setShowBulkConfirmModal(true);
  };

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
            case ActionEnum.SET_RENTED:
            case ActionEnum.SET_SOLD:
            case ActionEnum.DISABLE:
              return await disableProperty(propertyId, action);
            case ActionEnum.DELETE:
              return await deleteProperty(propertyId);
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

  const handleSearchQueryChanged = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  if (status === 'loading' || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg">
            {isRedirecting ? 'Redirection vers la page de connexion...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {user?.agency && (
          <Card className="border-none bg-gray-900 text-gray-200 shadow-none">
            <CardBody className="p-6">
              <div className="flex items-start gap-4">
                <Avatar
                  src={user.agency.logo ? `${imagesDomain}${user.agency.logo}` : undefined}
                  alt={user.agency.name}
                  className="h-16 w-16 bg-gray-700"
                  radius="sm"
                  isBordered
                  showFallback
                  fallback={<Building2 className="h-8 w-8 text-gray-200" />}
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{user.agency.name}</h2>
                  {(user.agency.city || user.agency.address) && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-gray-300">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[user.agency.city, user.agency.address].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="bg-white pt-6 pb-6 shadow-none">
          <CardBody className="text-foreground p-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-default-900 text-3xl font-bold">Mes Annonces</h1>
                <p className="text-default-600">
                  {total} {total > 1 ? 'annonces' : 'annonce'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <div
          className={`sticky top-0 z-40 border-b border-gray-200 bg-white pt-4 pb-4 ${isScrolled ? 'shadow-md' : ''}`}
        >
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Rechercher par titre, localisation ou référence..."
              value={searchQuery}
              onValueChange={handleSearchQueryChanged}
              startContent={<Search className="text-default-400 h-5 w-5" />}
              className="max-w-md flex-1"
              size="md"
              radius="lg"
              isClearable
              aria-label="Barre de recherche des annonces"
            />
            <Select
              placeholder="Tous les statuts"
              selectionMode="multiple"
              selectedKeys={statusFilter}
              aria-label="Filtrer par statut"
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys) as string[];
                const newSelection = new Set(keysArray);

                if (keysArray.length === 0) {
                  setStatusFilter(new Set(['all']));
                  return;
                }

                if (newSelection.has('all') && !statusFilter.has('all')) {
                  setStatusFilter(new Set(['all']));
                } else if (newSelection.has('all') && statusFilter.has('all')) {
                  newSelection.delete('all');
                  if (newSelection.size === 0) {
                    setStatusFilter(new Set(['all']));
                  } else {
                    setStatusFilter(newSelection);
                  }
                } else {
                  setStatusFilter(newSelection);
                }

                setPage(1);
              }}
              className="flex-1"
              size="md"
              radius="full"
              variant="bordered"
            >
              <SelectItem key="all">Tous les statuts</SelectItem>
              <>
                {propertyStatusesConfig.map((status) => (
                  <SelectItem key={status.value}>{status.label}</SelectItem>
                ))}
              </>
            </Select>
            <Select
              placeholder="Tous les types"
              selectionMode="multiple"
              selectedKeys={propertyTypeFilter}
              aria-label="Filtrer par type"
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys) as string[];
                const newSelection = new Set(keysArray);

                if (keysArray.length === 0) {
                  setPropertyTypeFilter(new Set(['all']));
                  return;
                }

                if (newSelection.has('all') && !propertyTypeFilter.has('all')) {
                  setPropertyTypeFilter(new Set(['all']));
                } else if (newSelection.has('all') && propertyTypeFilter.has('all')) {
                  newSelection.delete('all');
                  if (newSelection.size === 0) {
                    setPropertyTypeFilter(new Set(['all']));
                  } else {
                    setPropertyTypeFilter(newSelection);
                  }
                } else {
                  setPropertyTypeFilter(newSelection);
                }

                setPage(1);
              }}
              className="flex-1"
              size="md"
              radius="full"
              variant="bordered"
            >
              {[
                <SelectItem key="all">Tous les types</SelectItem>,
                ...propertyTypesConfig.map((type) => (
                  <SelectItem key={type.value}>{type.label}</SelectItem>
                )),
              ]}
            </Select>
            <Select
              placeholder="Toutes les transactions"
              selectedKeys={[transactionTypeFilter]}
              onSelectionChange={(keys) => {
                setTransactionTypeFilter(Array.from(keys)[0] as string);
                setPage(1);
              }}
              className="flex-1"
              size="md"
              radius="full"
              variant="bordered"
              aria-label="Filtrer par type de transaction"
            >
              <SelectItem key="all">Toutes les transactions</SelectItem>
              <>
                {allPropertyTransactionTypes.map((type) => (
                  <SelectItem key={type}>{type}</SelectItem>
                ))}
              </>
            </Select>
          </div>
        </div>
        <Card className="border border-gray-50 bg-white shadow-none">
          <CardHeader className="flex flex-col gap-4 p-4">
            <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <Checkbox
                isSelected={selectedProperties.size === properties.length && properties.length > 0}
                isIndeterminate={
                  selectedProperties.size > 0 && selectedProperties.size < properties.length
                }
                onValueChange={handleSelectAll}
                size="md"
                isDisabled={properties.length === 0}
                aria-label="Sélectionner toutes les propriétés affichées"
              >
                Tout sélectionner ({selectedProperties.size} sélectionné
                {selectedProperties.size > 1 ? 's' : ''})
              </Checkbox>
              <div className="flex gap-3 sm:ml-auto">
                <Select
                  placeholder="Sélectionner un critère"
                  selectionMode="single"
                  selectedKeys={[sortBy]}
                  onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                  className="w-48"
                  size="md"
                  aria-label="Trier par"
                  radius="full"
                  variant="bordered"
                  isDisabled={properties.length === 0}
                >
                  {sortOptionsConfig.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      size="md"
                      variant="bordered"
                      color="secondary"
                      endContent={<ChevronDown className="h-4 w-4" />}
                      isDisabled={selectedProperties.size === 0}
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
                      onPress={() => handleBulkActionSelected(ActionEnum.SET_SOLD)}
                    >
                      Déjà vendu
                    </DropdownItem>
                    <DropdownItem
                      key="rented"
                      startContent={<CheckCircle className="h-4 w-4" />}
                      color="success"
                      onPress={() => handleBulkActionSelected(ActionEnum.SET_RENTED)}
                    >
                      Déjà loué
                    </DropdownItem>
                    <DropdownItem
                      key="deactivate"
                      startContent={<Ban className="h-4 w-4" />}
                      color="warning"
                      onPress={() => handleBulkActionSelected(ActionEnum.DISABLE)}
                    >
                      Désactiver
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      startContent={<Trash2 className="h-4 w-4" />}
                      color="danger"
                      onPress={() => handleBulkActionSelected(ActionEnum.DELETE)}
                    >
                      Supprimer
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 p-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <PropertyManagementSkeleton key={index} />
              ))
            ) : properties.length > 0 ? (
              properties.map((property) => (
                <div key={property.id} className="flex items-start gap-4">
                  <Checkbox
                    isSelected={selectedProperties.has(property.id)}
                    onValueChange={(checked) => handleSelectProperty(property.id, checked)}
                    className="mt-4"
                    size="md"
                    aria-label={`Sélectionner l'annonce ${property.title}`}
                  />
                  <div className="flex-1">
                    <PropertyManagementCard
                      property={property}
                      imagesDomain={imagesDomain}
                      onPropertyChanged={handlePropertyChanged}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-default-500 py-8 text-center">
                Aucune annonce ne correspond à votre recherche
              </div>
            )}
          </CardBody>
        </Card>

        {properties.length > 0 && total > limit && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <Pagination
              total={Math.ceil(total / limit)}
              page={page}
              onChange={setPage}
              showControls
              color="primary"
              size="lg"
            />
            <p className="text-default-500 text-sm">
              Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, total)} sur {total}{' '}
              biens
            </p>
          </div>
        )}
      </div>

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
