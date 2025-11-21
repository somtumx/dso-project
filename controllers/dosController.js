const db = require('../db');

// Helper to map DB columns to Frontend expected keys
const mapToFrontend = (row) => {
    return {
        DO_Task_ID: row.id,
        SAP_DO_Number: row.sap_do_number,
        Branch: row.branch,
        Delivery_Date: row.delivery_date,
        Sales_Admin_Remarks: row.sales_admin_remarks,
        Overall_Status: row.overall_status,
        Sales_Admin_Name: row.sales_admin_name,
        Sales_Admin_Email: row.sales_admin_email,
        Sales_Admin_Timestamp: row.created_at,
        Dispatcher_Name_DO: row.dispatcher_name,
        Dispatcher_Email_DO: row.dispatcher_email,
        Dispatcher_DO_Confirm_Timestamp: row.dispatcher_ack_time,
        Dispatcher_Shipment_Qty: row.shipment_qty,
        Dispatcher_Notes: row.dispatcher_notes,
        Dispatcher_Shipment_Confirm_Timestamp: row.shipment_time,
        Rejection_Reason: row.rejection_reason,
        Last_Updated: row.last_updated || row.created_at
    };
};

exports.getAllDOs = async (req, res) => {
  const { salesAdminDate, deliveryDateStart, deliveryDateEnd, status, branch } = req.query;

  let sql = 'SELECT * FROM dos WHERE 1=1';
  const params = [];

  if (salesAdminDate) {
    // Assuming created_at is timestamp, we check date part
    sql += ' AND DATE(created_at) = ?';
    params.push(salesAdminDate);
  }
  if (deliveryDateStart) {
      sql += ' AND delivery_date >= ?';
      params.push(deliveryDateStart);
  }
  if (deliveryDateEnd) {
      sql += ' AND delivery_date <= ?';
      params.push(deliveryDateEnd);
  }
  if (status) {
      sql += ' AND overall_status = ?';
      params.push(status);
  }
  if (branch) {
      sql += ' AND branch = ?';
      params.push(branch);
  }

  sql += ' ORDER BY id DESC';

  try {
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows.map(mapToFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingDOs = async (req, res) => {
    // Replicates getPendingDOs from GAS
    const { salesAdminDate, deliveryDateStart, deliveryDateEnd } = req.query;
    let sql = `SELECT * FROM dos WHERE overall_status IN ('รอยืนยัน DO', 'โอนงาน') AND (dispatcher_email IS NULL OR dispatcher_email = '')`;
    const params = [];

    if (salesAdminDate) { sql += ' AND DATE(created_at) = ?'; params.push(salesAdminDate); }
    if (deliveryDateStart) { sql += ' AND delivery_date >= ?'; params.push(deliveryDateStart); }
    if (deliveryDateEnd) { sql += ' AND delivery_date <= ?'; params.push(deliveryDateEnd); }

    sql += ' ORDER BY id DESC';

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows.map(mapToFrontend) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAcknowledgedDOs = async (req, res) => {
    const userEmail = req.user.email; // From auth middleware
    const { salesAdminDate, deliveryDateStart, deliveryDateEnd } = req.query;

    let sql = `SELECT * FROM dos WHERE dispatcher_email = ? AND overall_status IN ('กำลังดำเนินการ', 'ดำเนินการเสร็จสิ้น', 'แก้ไขโดย Sale Admin')`;
    const params = [userEmail];

    if (salesAdminDate) { sql += ' AND DATE(created_at) = ?'; params.push(salesAdminDate); }
    if (deliveryDateStart) { sql += ' AND delivery_date >= ?'; params.push(deliveryDateStart); }
    if (deliveryDateEnd) { sql += ' AND delivery_date <= ?'; params.push(deliveryDateEnd); }

    sql += ' ORDER BY id DESC';

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows.map(mapToFrontend) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDODetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM dos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'DO not found' });
    }
    res.json({ success: true, data: mapToFrontend(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDO = async (req, res) => {
  const { sap_do_number, branch, delivery_date, sales_admin_remarks, confirm_submission } = req.body;

  if (!confirm_submission) return res.json({ success: false, message: "Please confirm submission" });

  try {
    const result = await db.query(
      'INSERT INTO dos (sap_do_number, branch, delivery_date, sales_admin_remarks, overall_status, sales_admin_name, sales_admin_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sap_do_number, branch, delivery_date, sales_admin_remarks, 'รอยืนยัน DO', req.user.display_name, req.user.email]
    );
    res.status(201).json({ success: true, message: 'DO created', taskId: result[0].insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRemarks = async (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;
    try {
        await db.query('UPDATE dos SET sales_admin_remarks = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?', [remarks, id]);
        res.json({ success: true, message: 'Remarks updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.handleAction = async (req, res) => {
    const { action, taskId, reason, note, formData } = req.body;
    const user = req.user;

    if (!action || !taskId) return res.status(400).json({ success: false, message: "Missing action or taskId" });

    try {
        // Fetch current status
        const [rows] = await db.query('SELECT * FROM dos WHERE id = ?', [taskId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Task not found" });
        const currentTask = rows[0];

        if (action === 'acknowledge') {
             if (!['รอยืนยัน DO', 'โอนงาน'].includes(currentTask.overall_status)) {
                 return res.json({ success: false, message: "Task not available" });
             }
             await db.query(
                 'UPDATE dos SET overall_status = ?, dispatcher_email = ?, dispatcher_name = ?, dispatcher_ack_time = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                 ['กำลังดำเนินการ', user.email, user.display_name, taskId]
             );
             return res.json({ success: true, message: "Task acknowledged" });
        }

        if (action === 'reject') {
             await db.query(
                 'UPDATE dos SET overall_status = ?, rejection_reason = ?, dispatcher_email = NULL, dispatcher_name = NULL, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                 ['รอ Sales Admin แก้ไข', reason, taskId]
             );
             return res.json({ success: true, message: "Task rejected" });
        }

        if (action === 'transfer') {
            await db.query(
                 'UPDATE dos SET overall_status = ?, dispatcher_email = NULL, dispatcher_name = NULL, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                 ['โอนงาน', taskId]
             );
             return res.json({ success: true, message: "Task transferred" });
        }

        if (action === 'shipment') {
            const id = formData.task_id_shipment;
            const qty = formData.shipment_qty;
            const notes = formData.shipment_notes;

            await db.query(
                'UPDATE dos SET overall_status = ?, shipment_qty = ?, dispatcher_notes = ?, shipment_time = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                ['ดำเนินการเสร็จสิ้น', qty, notes, id]
            );
             return res.json({ success: true, message: "Shipment confirmed" });
        }

        if (action === 'acknowledgeSaleAdminEdit') {
             await db.query(
                 'UPDATE dos SET overall_status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                 ['กำลังดำเนินการ', taskId]
             );
             return res.json({ success: true, message: "Acknowledged edit" });
        }

        return res.json({ success: false, message: "Unknown action" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteDO = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM dos WHERE id = ?', [id]);
    res.json({ success: true, message: 'DO deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
