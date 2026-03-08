CREATE TABLE public.market_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to market_expenses" ON public.market_expenses
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_market_expenses_updated_at
  BEFORE UPDATE ON public.market_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();