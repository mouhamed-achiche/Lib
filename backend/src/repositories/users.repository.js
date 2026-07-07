const bcrypt = require("bcryptjs");
const getPool = require("../config/db");
const { mapUserRow } = require("../lib/mappers");

async function getUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    String(email).toLowerCase(),
  ]);
  const row = rows[0];
  if (!row) return null;
  return { ...row, passwordHash: row.password, id: String(row.id) };
}

async function getUserById(id) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  const row = rows[0];
  if (!row) return null;
  return { ...row, passwordHash: row.password, id: String(row.id) };
}

async function registerUser({ name, email, password, phone, address, city }) {
  const pool = getPool();
  const normalizedEmail = String(email).toLowerCase().trim();
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
  if (existing.length) {
    const error = new Error("An account with that email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const hashed = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, phone, address, city, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      name.trim(),
      normalizedEmail,
      hashed,
      phone?.trim() || null,
      address?.trim() || null,
      city?.trim() || null,
      "customer",
    ],
  );

  const [rows] = await pool.query(
    "SELECT id, name, email, role, phone, address, city, created_at FROM users WHERE id = ?",
    [result.insertId],
  );
  return mapUserRow(rows[0]);
}

async function updateUser(userId, data) {
  const pool = getPool();
  const fields = [];
  const values = [];
  if (data.name) {
    fields.push("name = ?");
    values.push(data.name.trim());
  }
  if (data.email) {
    fields.push("email = ?");
    values.push(data.email.trim().toLowerCase());
  }
  if (data.phone !== undefined) {
    fields.push("phone = ?");
    values.push(data.phone?.trim() || null);
  }
  if (data.address !== undefined) {
    fields.push("address = ?");
    values.push(data.address?.trim() || null);
  }
  if (data.city !== undefined) {
    fields.push("city = ?");
    values.push(data.city?.trim() || null);
  }
  if (!fields.length) return getUserById(userId).then((u) => (u ? mapUserRow(u) : null));

  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

  const [rows] = await pool.query(
    "SELECT id, name, email, role, phone, address, city, created_at FROM users WHERE id = ?",
    [userId],
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

async function changePassword(userId, currentPassword, newPassword) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);
  if (!rows.length) return null;

  const valid = await bcrypt.compare(currentPassword, rows[0].password);
  if (!valid) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);

  return updateUser(userId, {});
}

function toPublicUser(user) {
  if (!user) return null;
  if (user.created_at || (user.phone !== undefined && !user.passwordHash)) {
    return mapUserRow(user);
  }
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? "",
    address: user.address ?? "",
    city: user.city ?? "",
  };
}

module.exports = {
  getUserByEmail,
  getUserById,
  registerUser,
  updateUser,
  changePassword,
  toPublicUser,
  mapUserRow,
};
