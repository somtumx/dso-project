const db = require('../db');

exports.getAllDOs = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDODetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM dos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'DO not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDO = async (req, res) => {
  const { sap_do_number, branch, delivery_date, sales_admin_remarks, overall_status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO dos (sap_do_number, branch, delivery_date, sales_admin_remarks, overall_status) VALUES (?, ?, ?, ?, ?)',
      [sap_do_number, branch, delivery_date, sales_admin_remarks, overall_status]
    );
    // db.query returns [result, fields] for insert
    res.status(201).json({ message: 'DO created', id: result[0].insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDO = async (req, res) => {
  const { id } = req.params;
  const { sap_do_number, branch, delivery_date, sales_admin_remarks, overall_status } = req.body;
  try {
     // Using dynamic update query
    let updateFields = [];
    let params = [];
    if (sap_do_number !== undefined) { updateFields.push('sap_do_number = ?'); params.push(sap_do_number); }
    if (branch !== undefined) { updateFields.push('branch = ?'); params.push(branch); }
    if (delivery_date !== undefined) { updateFields.push('delivery_date = ?'); params.push(delivery_date); }
    if (sales_admin_remarks !== undefined) { updateFields.push('sales_admin_remarks = ?'); params.push(sales_admin_remarks); }
    if (overall_status !== undefined) { updateFields.push('overall_status = ?'); params.push(overall_status); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    params.push(id);

    await db.query(`UPDATE dos SET ${updateFields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'DO updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDO = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM dos WHERE id = ?', [id]);
    res.json({ message: 'DO deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
