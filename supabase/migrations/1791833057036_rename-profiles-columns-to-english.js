/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = pgm => {
  pgm.renameColumn("profiles", "nome_completo", "full_name")
  pgm.renameColumn("profiles", "data_nascimento", "birth_date")
  pgm.renameColumn("profiles", "telefone", "phone")
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = pgm => {
  pgm.renameColumn("profiles", "full_name", "nome_completo")
  pgm.renameColumn("profiles", "birth_date", "data_nascimento")
  pgm.renameColumn("profiles", "phone", "telefone")
}
