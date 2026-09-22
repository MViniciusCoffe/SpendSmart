exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("profiles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    nome_completo: { type: "text", notNull: true },
    data_nascimento: { type: "date" },
    telefone: { type: "text" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("categories", {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "uuid", notNull: true },
    name: { type: "text", notNull: true },
    type: { type: "text", notNull: true },
    description: { type: "text" },
    color: { type: "text", notNull: true, default: "#FFFFFF" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("categories", "categories_type_check", {
    check: "type IN ('income', 'expense')",
  });
  pgm.addConstraint("categories", "categories_user_name_type_unique", {
    unique: ["user_id", "name", "type"],
  });

  pgm.createTable("incomes", {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "uuid", notNull: true },
    category_id: { type: "bigint", notNull: true },
    amount: { type: "numeric(12,2)", notNull: true },
    source: { type: "text", notNull: true },
    occurred_on: { type: "date", notNull: true },
    description: { type: "text" },
    payment_method: { type: "text" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("incomes", "incomes_amount_positive", {
    check: "amount > 0",
  });
  pgm.addConstraint("incomes", "incomes_category_fk", {
    foreignKeys: {
      columns: "category_id",
      references: "categories(id)",
      onDelete: "RESTRICT",
    },
  });

  pgm.createTable("expenses", {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "uuid", notNull: true },
    category_id: { type: "bigint", notNull: true },
    amount: { type: "numeric(12,2)", notNull: true },
    name: { type: "text", notNull: true },
    occurred_on: { type: "date", notNull: true },
    description: { type: "text" },
    payment_method: { type: "text" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("expenses", "expenses_amount_positive", {
    check: "amount > 0",
  });
  pgm.addConstraint("expenses", "expenses_category_fk", {
    foreignKeys: {
      columns: "category_id",
      references: "categories(id)",
      onDelete: "RESTRICT",
    },
  });

  pgm.createIndex("categories", "user_id", {
    name: "categories_user_id_idx",
  });
  pgm.createIndex("incomes", ["user_id", "occurred_on"], {
    name: "incomes_user_date_idx",
  });
  pgm.createIndex("expenses", ["user_id", "occurred_on"], {
    name: "expenses_user_date_idx",
  });
  pgm.createIndex("incomes", "category_id", {
    name: "incomes_category_idx",
  });
  pgm.createIndex("expenses", "category_id", {
    name: "expenses_category_idx",
  });

  // O PostgreSQL local nao possui auth.users/auth.uid(). No Supabase, esta
  // etapa adiciona as referencias e as politicas de isolamento.
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE profiles
          ADD CONSTRAINT profiles_auth_user_fk
          FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE categories
          ADD CONSTRAINT categories_auth_user_fk
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE incomes
          ADD CONSTRAINT incomes_auth_user_fk
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE expenses
          ADD CONSTRAINT expenses_auth_user_fk
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

        EXECUTE 'CREATE POLICY profiles_owner_policy ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
        EXECUTE 'CREATE POLICY categories_owner_policy ON categories FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY incomes_owner_policy ON incomes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY expenses_owner_policy ON expenses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("expenses");
  pgm.dropTable("incomes");
  pgm.dropTable("categories");
  pgm.dropTable("profiles");
};
