# Water Meters

## Техническое задание:
Создать приложение для отображения списка счётчиков горячей и холодной воды.
Дизайн: https://www.figma.com/design/gxVXNv5MEY8RQ1KXRVvkUT/%D0%A2%D0%B5%D1%81%D1%82-(%D1%84%D1%80%D0%BE%D0%BD%D1%82)?node-id=0-1&t=QQ9ijj1biJPPjj7s-0;

1. Список счётчиков.
   Счётчики получать запросом GET
   http://showroom.eis24.me/c300/api/v4/test/meters/ Параметры limit=20 и offset
   (выводить по 20 на страницу).
   Данные должны выводиться на странице с внутренним скроллом
   («шапка» фиксированная, табличка скроллится внутри).
    Колонки:
       - Порядковый номер.
       - Тип (ColdWaterAreaMeter — ХВС, HotWaterAreaMeter — ГВС).
       - Дата установки в формате дд.мм.гггг.
       - Автоматический ли он (is_automatic). 
       - Значение (initial_values).
       - Адреc. 
       - Примечание (description).

2. Адрес счётчика.
   Адреса получать параллельным запросом
   GET http://showroom.eis24.me/c300/api/v4/test/areas/ с параметром списка айди id in.
   Продумать оптимизацию, не запрашивать уже известные адреса.
   Выводить улицу, дом, номер квартиры.

3. Удаление счётчика.
   При наведении на строку должна появляться кнопка удаления, инициирующая
   удаление счётчика (DELETE
   http://showroom.eis24.me/c300/api/v4/test/meters/:meterId/). На странице при этом
   всегда должно оставаться 20 элементов.

Стек технологий:
Использовать React, TypeScript, mobx-state-tree — обязательно,
styled-components — по желанию.

Конфиг Prettier
`trailingComma: "es5"
tabWidth: 2
semi: true
singleQuote: true
printWidth: 80`

Проект выложить на github.