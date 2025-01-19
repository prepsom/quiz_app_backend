FROM node:21.7.3
ENV APP_DIR=/apps/prepsom-games-backend
COPY . ${APP_DIR}
WORKDIR ${APP_DIR}
RUN npm install
CMD ["node", "dist/index.js"]