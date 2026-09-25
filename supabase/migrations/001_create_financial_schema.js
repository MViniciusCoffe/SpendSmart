exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("profiles", {
    id: { type: "uuid", primaryKey: true },
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

  pgm.createTable("transactions", {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "uuid", notNull: true },
    category_id: { type: "bigint", notNull: true },
    type: { type: "text", notNull: true },
    amount: { type: "numeric(12,2)", notNull: true },
    title: { type: "text", notNull: true },
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

  pgm.addConstraint("transactions", "transactions_type_check", {
    check: "type IN ('income', 'expense')",
  });
  pgm.addConstraint("transactions", "transactions_amount_positive", {
    check: "amount > 0",
  });
  pgm.addConstraint("transactions", "transactions_category_fk", {
    foreignKeys: {
      columns: "category_id",
      references: "categories(id)",
      onDelete: "RESTRICT",
    },
  });

  pgm.createIndex("categories", "user_id", {
    name: "categories_user_id_idx",
  });
  pgm.createIndex("transactions", ["user_id", "occurred_on"], {
    name: "transactions_user_date_idx",
  });
  pgm.createIndex("transactions", ["user_id", "type"], {
    name: "transactions_user_type_idx",
  });
  pgm.createIndex("transactions", "category_id", {
    name: "transactions_category_idx",
  });

  // O PostgreSQL local nao possui auth.users/auth.uid(). No Supabase, esta
  // etapa liga os registros ao usuario autenticado e ativa o RLS.
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

        ALTER TABLE transactions
          ADD CONSTRAINT transactions_auth_user_fk
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

        EXECUTE 'CREATE POLICY profiles_owner_policy ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
        EXECUTE 'CREATE POLICY categories_owner_policy ON categories FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY transactions_owner_policy ON transactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("transactions");
  pgm.dropTable("categories");
  pgm.dropTable("profiles");
};
