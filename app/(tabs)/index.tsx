import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderStatusTabs } from '../../components/OrderStatusTabs';
import { StoreDomainSection } from '../../components/StoreDomainSection';
import { useOrders } from '../../hooks/useWooCommerce';
import { FlashList } from '@shopify/flash-list';
import { format, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import { Car, ShoppingBag, Plus, Calendar } from 'lucide-react-native';
import { CreateOrderModal } from '../../components/CreateOrderModal';
import { EditOrderModal } from '../../components/EditOrderModal';
import { StatusModal } from '../../components/StatusModal';
import { AcceptOrderModal } from '../../components/AcceptOrderModal';
import { DateFilterModal } from '../../components/DateFilterModal';

export default function OrdersScreen() {
  const [currentStatus, setCurrentStatus] = useState('w-kolejce');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: orders = [], isLoading } = useOrders();

  const isCurrentDate = startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();

  const filteredOrders = orders.filter(order => {
    let statusMatch = false;
    switch (currentStatus) {
      case 'w-kolejce':
        statusMatch = order.status === 'processing' || order.status === 'pending';
        break;
      case 'w-realizacji':
        statusMatch = order.status === 'w-produkcji' || order.status === 'gotowe';
        break;
      case 'zakonczone':
        statusMatch = order.status === 'completed' || order.status === 'cancelled';
        break;
      default:
        return false;
    }

    if (!statusMatch) return false;

    const orderUnix = order.meta_data.find(meta => meta.key === 'data_unix')?.value;
    if (!orderUnix) return false;

    const orderDate = new Date(Number(orderUnix) * 1000);
    return (
      orderDate >= startOfDay(selectedDate) &&
      orderDate <= endOfDay(selectedDate)
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    
    const aUnix = a.meta_data.find(meta => meta.key === 'data_unix')?.value || 0;
    const bUnix = b.meta_data.find(meta => meta.key === 'data_unix')?.value || 0;
    return Number(aUnix) - Number(bUnix);
  });

  const getTimeColor = (timestamp: number, status: string) => {
    if (!['pending', 'processing', 'w-produkcji'].includes(status)) {
      return '#111827';
    }

    const now = new Date();
    const orderTime = new Date(timestamp * 1000);
    const minutesDiff = differenceInMinutes(orderTime, now);

    if (minutesDiff <= 30) {
      return '#DC2626';
    } else if (minutesDiff <= 60) {
      return '#F97316';
    } else {
      return '#111827';
    }
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleStatusChange = (order: any) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleAcceptOrder = (order: any) => {
    setSelectedOrder(order);
    setShowAcceptModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Zamówienia - </Text>
          <Text style={[styles.dateText, !isCurrentDate && styles.dateTextHighlight]}>
            {format(selectedDate, 'dd/MM/yyyy')}
          </Text>
          <Pressable
            style={styles.calendarButton}
            onPress={() => setShowDateFilter(true)}>
            <Calendar size={20} color="#0073E6" />
          </Pressable>
        </View>
      </View>

      <StoreDomainSection />

      <OrderStatusTabs
        currentStatus={currentStatus}
        onStatusChange={setCurrentStatus}
      />

      {sortedOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak zamówień</Text>
        </View>
      ) : (
        <FlashList
          data={sortedOrders}
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const dataUnix = item.meta_data.find(meta => meta.key === 'data_unix')?.value;
            const orderTime = dataUnix ? format(new Date(Number(dataUnix) * 1000), 'HH:mm') : '--:--';
            const deliveryCost = item.fee_lines.find(fee => fee.name === "Koszt dowozu")?.total;
            const orderType = item.meta_data.find(meta => meta.key === 'exwfood_order_method')?.value;
            const timeColor = getTimeColor(Number(dataUnix), item.status);
            const orderNote = item.meta_data.find(meta => meta.key === 'order_note')?.value;
            
            return (
              <View style={[styles.orderCard, isPending && styles.pendingOrderCard]}>
                <View>
                  <View style={styles.orderHeader}>
                    <View style={styles.methodContainer}>
                      {orderType === 'delivery' ? (
                        <Car size={20} color="#0073E6" />
                      ) : (
                        <ShoppingBag size={20} color="#0073E6" />
                      )}
                      <Text style={styles.methodText}>
                        {orderType === 'delivery' ? 'Dowóz' : 'Odbiór'}
                      </Text>
                    </View>
                    <Text style={[styles.orderTime, { color: timeColor }]}>{orderTime}</Text>
                  </View>
                  <View style={styles.headerDivider} />
                </View>
                
                <Text style={styles.customerName}>
                  #{item.id} | {item.billing.first_name} {item.billing.last_name}
                </Text>
                
                {item.billing.address_1 && (
                  <Text style={styles.address}>{item.billing.address_1}</Text>
                )}
                
                {item.line_items.map((lineItem, index) => (
                  <Text key={index} style={styles.lineItem}>
                    {lineItem.quantity}x {lineItem.name}
                  </Text>
                ))}

                {orderNote && (
                  <Text style={styles.orderNote}>{orderNote}</Text>
                )}
                
                <View style={styles.footer}>
                  {isPending ? (
                    <Pressable
                      style={styles.acceptButton}
                      onPress={() => handleAcceptOrder(item)}>
                      <Text style={styles.acceptButtonText}>
                        Zaakceptuj - dodaj do kolejki
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.footerContent}>
                      <View style={styles.priceInfo}>
                        <Text style={styles.total}>Suma: {item.total} zł</Text>
                        {deliveryCost && (
                          <Text style={styles.deliveryCost}>Dowóz: {deliveryCost} zł</Text>
                        )}
                      </View>
                      <View style={[styles.buttonContainer, styles.buttonSpacing]}>
                        <Pressable
                          style={styles.button}
                          onPress={() => handleEditOrder(item)}>
                          <Text style={styles.buttonText}>Edytuj</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.button, styles.statusButton]}
                          onPress={() => handleStatusChange(item)}>
                          <Text style={[styles.buttonText, styles.statusButtonText]}>Status</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          estimatedItemSize={200}
          contentContainerStyle={styles.list}
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      )}

      <Pressable 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}>
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      <CreateOrderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedOrder && (
        <>
          <EditOrderModal
            visible={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
          />
          <StatusModal
            visible={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setSelectedOrder(null);
            }}
            orderId={selectedOrder.id}
            currentStatus={selectedOrder.status}
          />
          <AcceptOrderModal
            visible={showAcceptModal}
            onClose={() => {
              setShowAcceptModal(false);
              setSelectedOrder(null);
            }}
            orderId={selectedOrder.id}
            orderType={selectedOrder.meta_data.find((meta: any) => meta.key === 'exwfood_order_method')?.value}
            orderTime={Number(selectedOrder.meta_data.find((meta: any) => meta.key === 'data_unix')?.value)}
          />
        </>
      )}

      <DateFilterModal
        visible={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  dateText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  dateTextHighlight: {
    color: '#DC2626',
  },
  calendarButton: {
    marginLeft: 'auto',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    padding: 16,
  },
  listFooter: {
    height: 60,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pendingOrderCard: {
    borderWidth: 1,
    borderColor: '#0073E6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0073E6',
  },
  orderTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  lineItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  orderNote: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 12,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceInfo: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#0073E6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  deliveryCost: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
    marginTop: 5,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0073E6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0073E6',
  },
  statusButton: {
    backgroundColor: '#0073E6',
    borderColor: '#0073E6',
    width: 100,
  },
  statusButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 46,
    bottom: 31,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0073E6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});