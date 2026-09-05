import { OrderDetailsContainer } from "@/widgets/OrderDetails";

type OrderDetailsPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  return <OrderDetailsContainer orderId={id} />;
}
