# Step 1: Build React/Vite project
FROM node:20 AS build
WORKDIR /app

# ตั้งค่า Environment ให้รองรับ UTF-8 ระหว่าง Build
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# copy package.json
COPY package*.json ./

# ติดตั้ง dependency
RUN npm install

# copy source code ทั้งหมด
COPY . .

# build
RUN npm run build

# Step 2: ใช้ nginx serve frontend
FROM nginx:alpine

# ตั้งค่า Locale ใน Nginx stage
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# copy build ที่เสร็จแล้วไป nginx html
COPY --from=build /app/dist /usr/share/nginx/html

# copy nginx.conf ไปแทน default.conf (ต้องมั่นใจว่ามีไฟล์ nginx.conf ในเครื่องคุณ)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]