const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/branches', async (req, res) => {
    try {
        // Since we don't have a branches table in the init script, we can query distinct branches from 'dos' table
        // or just return a hardcoded list for now if 'dos' is empty.
        // But 'Code.gs' mentions a 'Branch_Master_List' sheet.
        // Let's mock it for now or use existing data.

        // Let's try to get from DOS first
        const [rows] = await db.query('SELECT DISTINCT branch FROM dos WHERE branch IS NOT NULL AND branch != ""');
        let branches = rows.map(row => row.branch);

        if (branches.length === 0) {
            // Fallback default branches
            branches = ["หาดใหญ่", "ภูเก็ต", "สมุย", "สุราษฎร์ธานี", "นครศรีธรรมราช", "ตรัง", "กระบี่"];
        }

        res.json({ success: true, data: branches });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
