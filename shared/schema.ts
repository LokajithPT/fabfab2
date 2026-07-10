// Custom Service Interface to match Flask-SQLAlchemy model
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  category?: string;
  status: string;
  usage_count: number;
}
