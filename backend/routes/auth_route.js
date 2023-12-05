const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const db = require('../server/models/database');
const path = require('path');
const bcrypt = require('bcryptjs');


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // 'index.html' 파일의 경로를 설정하세요.
});

router.post('/register', async (req, res) => {
    try {
        console.log(req.body);

        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;

        // 비밀번호 해시
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (err) {
            console.error('Password hashing error', err);
            return res.status(500).send('인터넷 서버문제로 해시값이 생성이 되지 않았어');
        }

        // 데이터베이스에 사용자 정보 저장
        const query = 'INSERT INTO signup (username, password, email) VALUES (?, ?, ?)';
        
        try {
            // mysql2/promise를 사용하여 async/await으로 DB 쿼리 실행
            const [results] = await db.execute(query, [username, hashedPassword, email]);
            console.log(results);
            console.log("회원가입 성공");
            res.status(200).send("ok");
        } catch (err) {
            console.error('Database insert error', err);
            return res.status(510).send('Internal Server Error - User registration failed');
        }
    } catch (err) {
        console.error('Unexpected error', err);
        res.status(500).send('Server error');
    }
});




router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html')); // 'index.html' 파일의 경로를 설정하세요.
    console.log('get요청은됨');
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("들어옴1")
        // 데이터베이스에서 사용자 검색
        const query = 'SELECT * FROM signup WHERE username = ?';
        const [users] = await db.query(query, [username]);

        if (users.length === 0) {
            res.status(400).send({ message: '존재하지 않는 사용자입니다.' });
            return;
        }

        const user = users[0]; // 첫 번째 사용자 정보 사용

        // 비밀번호 검증 (bcrypt 사용 시)
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(400).send({ message: '비밀번호가 일치하지 않습니다.' });
            return;
        }
        console.log("들어옴1")
        console.log(user)
        // 토큰 생성
        // const token = tokenService.getToken(user.username); // 예: user.id 또는 user.username
        // console.log(token)
        data = {/*token,*/ user }
        res.status(200).send(data);



        
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


router.post('/logout', (req, res) => {
    // 세션을 사용하는 경우 세션 정보를 삭제
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                // 세션 삭제 중 에러 처리
                return res.status(500).send('로그아웃 실패');
            }

            // 로그아웃 성공 처리
            res.status(200).send("로그아웃 완료");
        });
    } else {
        // JWT 토큰을 사용하는 경우, 클라이언트에서 토큰을 삭제하거나 무효화 처리
        res.send('Logged out successfully');
    }
});

module.exports = router;