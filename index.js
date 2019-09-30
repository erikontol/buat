const fetch = require('node-fetch');
const cheerio = require('cheerio');
const AntiCaptcha = require('./lib/antiCaptcha.ts');
const moment = require('moment');
const fs = require('async-file');
const delay = require('delay');
const readlineSync = require('readline-sync');
require('dotenv').config();

console.log('');
console.log('');
if (process.env.SOLVER_SERVICE === 'anti_captcha') {
    console.log(`
    ======== Menggunakan Anti Captcha ========
`);
}else if(process.env.SOLVER_SERVICE === 'dbc'){
    console.log(`
    ======== Menggunakan Dead By Captcha ========
`);
}else{
    console.log(`
    ======== Pastikan menambahkan captcha solver service di .env anti_captcha/dbc ========
`);
process.exit(0)
}
const jumlah = readlineSync.question('Berapa akun yang akan anda buat ? ');
console.log('');
console.log('');

function randNumber(length) {
	result = '';
	const characters = '0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function randstr(length) {
	result = '';
	const characters = '012345678910abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


const generateName = () => new Promise((resolve, reject) => {
    fetch('https://api.randomuser.me/', {
        method:'GET'
    })
    .then(res => res.json())
    .then(res => {
        resolve(res)
    })
    .catch(err => {
        reject(err)
    })
})


const getCookie = () => new Promise((resolve, reject) => {
    fetch('https://www.marlboro.id/auth/register', {
        method: 'GET',
    }).then(async res => {
        const $ = cheerio.load(await res.text());
        const result = {
            cookie: res.headers.raw()['set-cookie'],
            csrf: $('input[name=decide_csrf]').attr('value')
        }

        resolve(result)
    })
    .catch(err => reject(err))
});

const checkPersonIndentity = (cooks, csrf, ktp) =>  new Promise((resolve, reject) => {
    const dataString = `decide_csrf=${csrf}&ktp_number=${ktp}`;

    fetch('https://www.marlboro.id/auth/search-person', {
        method: 'POST',
        headers:{
            'sec-fetch-mode': 'cors',
            'origin': 'https://www.marlboro.id',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'x-requested-with': 'XMLHttpRequest',
            'cookie': cooks,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'referer': 'https://www.marlboro.id/auth/register',
            'authority': 'www.marlboro.id',
            'sec-fetch-site': 'same-origin'
        },
        body: dataString
    })
    .then(res => res.json())
    .then(result => resolve(result))
    .catch(err => reject(err))
})

const register = (cooks, data, csrf, gresponse) => new Promise((resolve, reject) => {
    fetch('https://www.marlboro.id/auth/register', {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            cookie: cooks,
            host: 'www.marlboro.id',
            origin: 'https://www.marlboro.id',
            referer: 'https://www.marlboro.id/auth/register',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
        },
        body: `name=${data.name}&ktp_number=${data.ktpNumber}&email=${data.email}&password=${data.password}&ref_email=&t_and_c=on&g-recaptcha-response=${gresponse}&decide_csrf=${csrf}&ref_uri=/&param=&sitekey=6LfFZpEUAAAAAAOeeFUdj-v_pUMb28yoq6SyjBta`

    }).then(res => res.json())
    .then(result => resolve(result))
    .catch(err => reject(err))
});

const functionGetLink = (email, domain) =>new Promise((resolve, reject) => {
    fetch(`https://generator.email/${domain}/${email}`, {
        method: "get",
        headers: {
            accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
            "accept-encoding": "gzip, deflate, br",
            cookie: `_ga=GA1.2.659238676.1567004853; _gid=GA1.2.273162863.1569757277; embx=%5B%22${email}%40${domain}%22%2C%22hcycl%40nongzaa.tk%22%5D; _gat=1; io=io=tIcarRGNgwqgtn40O${randstr(3)}; surl=${domain}%2F${email}`,
            "upgrade-insecure-requests": 1,
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36"
        }
    })
        .then(res => res.text())
        .then(text => {
            const $ = cheerio.load(text);
            const src = $("a[name=staging_marlboro_id_auth_verify_ema]").attr('href');
            resolve(src);
        })
        .catch(err => reject(err));
});

const functionVeryf = (url) => new Promise((resolve, reject) => {
    fetch(url, {
        method: "get"
    })
        .then(res => res.text())
        .then(text => {
            const $ = cheerio.load(text);
            const src = $("p.staticp__text.mb50").text();
            resolve(src);
        })
        .catch(err => reject(err));
});




(async () => {
    if (process.env.ANTI_CAPTCHA_CLIENT_ID !== 'default') {
        for (let index = 0; index < jumlah; index++) {
            const name = await generateName();
            const emailUname = `${name.results[0].name.first}${randstr(3)}${randNumber(3)}`;
            console.log(`[${moment().format("HH:mm:ss")}] Mencoba mendaftar dengan email : ${emailUname}@aminudin.me`);
            const cookie = await getCookie();
            console.log(`[${moment().format("HH:mm:ss")}] Mencoba mengambil cookie`);
            const cook = cookie.cookie.join().split(',');
            const deviceId = cook[0].split(';')[0];
            const session = cook[2].split(';')[0]
            const realCookie = `${deviceId}; ${session}; insdrSV=1; scs=%7B%22t%22%3A1%7D; ins-gaSSId=fdc5ea30-c439-e8e4-e41e-9a1e27d707bf_1567371798; ins-mig-done=1; _p1K4r_=true; pikar_redirect=true`
            const csrf = cookie.csrf;
            const data = {
                name: `${name.results[0].name.first} ${name.results[0].name.last}`,
                email: `${emailUname}@aminudin.me`,
                password: 'Kevingans123@',
                ktpNumber: `3213${randNumber(3)}1123700${randNumber(2)}`
            }
            console.log(`[${moment().format("HH:mm:ss")}] Cek NIK Ktp : ${data.ktpNumber}`);
            const ktpResult = await checkPersonIndentity(realCookie, csrf, data.ktpNumber);
            if (ktpResult.data.is_exist !== true) {
                console.log(`[${moment().format("HH:mm:ss")}] NIK Ktp ${data.ktpNumber} bisa didaftarkan.`);
                console.log(`[${moment().format("HH:mm:ss")}] Mencoba solving captcha.`);
                let gCaptcha;
                if (process.env.SOLVER_SERVICE === 'anti_captcha') {
                    const antiCaptcha = await AntiCaptcha.GetGCaptcha(process.env.ANTI_CAPTCHA_CLIENT_ID);
                    gCaptcha += antiCaptcha.solution.gRecaptchaResponse
                } else if(process.env.SOLVER_SERVICE === 'dbc') {
                    const dbc = await AntiCaptcha.dbcProccess(process.env.DBC_USERNAME, process.env.DBC_PASSWORD);
                    gCaptcha += dbc
                }else{
                    gCaptcha += 'Oops'
                }
                console.log(`[${moment().format("HH:mm:ss")}] Berhasil mendapatkan gCaptcha response : ${gCaptcha.split('undefined')[1]}`);
                console.log(`[${moment().format("HH:mm:ss")}] Mencoba Register.`);
                const regis = await register(realCookie, data, csrf, gCaptcha.split('undefined')[1]);
                if (regis.data.code === 200) {
                    console.log(`[${moment().format("HH:mm:ss")}] Sukses Register`);
                    console.log(`[${moment().format("HH:mm:ss")}] Mencoba Mengambil Link Untuk Verifikasi.`);
                    const getLink = await functionGetLink(emailUname, 'aminudin.me');
                    if (getLink) {
                        console.log(`[${moment().format("HH:mm:ss")}] Berhasil mendapatkan link : ${getLink}`);
                        console.log(`[${moment().format("HH:mm:ss")}] Mencoba Mem-Verifikasikan Email.`);
                        const veryf = await functionVeryf(getLink)
                        console.log(`[${moment().format("HH:mm:ss")}] Sukses : ${veryf} `);
                        console.log(`[${moment().format("HH:mm:ss")}] Data akun tersimpan di file akun.txt`);
                        fs.appendFile('akun.txt', `\n${data.email}|${data.password}|${data.ktpNumber}\n`);
                        console.log('');
                        console.log('');
                    } else {
                        console.log(`[${moment().format("HH:mm:ss")}] Gagal mendapatkan link, silahkan verifikasi manual di : https://generator.email/aminudin.me/${emailUname}`);
                        console.log(`[${moment().format("HH:mm:ss")}] Data akun tersimpan di file akun.txt`);
                        fs.appendFile('akun.txt', `\n${data.email}|${data.password}|${data.ktpNumber}|https://generator.email/aminudin.me/${emailUname}\n`);
                        console.log('');
                        console.log('');
                    }
                    
                }else{
                    console.log(`[${moment().format("HH:mm:ss")}] Gagal Register`);
                    console.log(`[${moment().format("HH:mm:ss")}] Error : ${JSON.stringify(regis)}`);
                    console.log('');
                    console.log('');
                }
            }else{
                console.log(`[${moment().format("HH:mm:ss")}] NIK Ktp ${data.ktpNumber} sudah terdaftar.`);
                console.log('');
                console.log('');
            }
        }
    }else{
        console.log(`[${moment().format("HH:mm:ss")}] Pastikan kalian sudah menambahkan client_id pada .env`);
    }
})();