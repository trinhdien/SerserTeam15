const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Customer = require('../models/customerModel');
const jwtConfig = require('../config/jwtConfig');
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const customer = await Customer.findByEmail(email);

        // Kiểm tra user tồn tại
        if (!customer) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // So sánh mật khẩu sử dụng bcrypt
        // const isMatch = await bcrypt.compare(password, user.password);
        // if (!isMatch) {
        //     return res.status(401).json({ error: 'Invalid credentials' });
        // }

        // Tạo JWT
        const token = jwt.sign(
            { id: customer.id, email: customer.email },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        res.json({
            success: true,
            token,
            user: { id: customer.id, email: customer.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};