FROM php:8.4-apache

# Cài đặt extension (giống như trước nhưng không cần libzip-dev vì một số bản đã có sẵn)
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev libfreetype6-dev libzip-dev zip unzip git curl \
    && docker-php-ext-install pdo_mysql gd zip

# Enable mod_rewrite cho Laravel
RUN a2enmod rewrite

# Cấu hình DocumentRoot của Apache vào thư mục /public của Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html
COPY . .

# Cài đặt Composer và quyền hạn như các bước trước...
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data storage bootstrap/cache

# Lệnh khởi chạy (Apache sẽ tự động chạy ở cổng 80 bên trong container)

# Chạy migration và seed dữ liệu trước khi khởi động server

CMD apache2-foreground
