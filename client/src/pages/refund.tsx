export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>
      <div className="prose prose-sm max-w-none space-y-4">
        <p>We strive to provide the best service. If you're not satisfied, here's our refund policy.</p>
        <h2>Service Issues</h2>
        <p>If there is a problem with our service, please contact us within 24 hours of delivery.</p>
        <h2>Refund Processing</h2>
        <p>Refunds are processed within 5-7 business days to the original payment method.</p>
        <h2>Non-Refundable Items</h2>
        <p>Items already processed that were not damaged or lost are generally not eligible for refund.</p>
        <h2>Cancellations</h2>
        <p>Orders cancelled before processing begin are eligible for full refund.</p>
      </div>
    </div>
  );
}
