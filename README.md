# 🚀 React + Vite Starter Template

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Template starter untuk proyek React modern dengan Vite, TypeScript, dan ESLint yang sudah dikonfigurasi.

## 🔥 Fitur Unggulan

- ⚡ **Vite 5** - Build tool berkecepatan tinggi
- ⚛️ **React 18** dengan Fast Refresh
- 🛠 **TypeScript** - Type checking out of the box
- ✨ **ESLint** - Konfigurasi linting optimal
- 📦 **Zero-config** - Siap pakai tanpa setup rumit

## 🛠️ Panduan Instalasi

### Prasyarat
- Node.js ≥20.x
- npm/yarn/pnpm

### Langkah Setup
```bash
# 1.
install nginx
# 2. Install dependencies
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# 3.
sudo apt-get install -y nodejs
node -v
# 5.
cd /var/www
# 6.
git clone https://github.com/kapoylawas/frontend-laboratoriumsda.git
# 7.
cd frontend-laboratoriumsda
# 8.
npm install
# 9.
nano .env

copas di bawah ini :

VITE_APP_BASEURL=https://api-lab.sidoarjokab.go.id
# 10.
npm run build
# 11.
cd /etc/nginx/sites-available

copas di bawah ini :

server {
    listen 80 default_server;
    server_name express-react.my.id;

    root /var/www/frontend-laboratoriumsda/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /index.html;

    location ~ /\.ht {
        deny all;
    }
}
# 12.
sudo service nginx restart