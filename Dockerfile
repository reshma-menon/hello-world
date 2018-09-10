# Latest LTS (long term support) version
# FROM 01alchemist/node-pg:10.5.0
FROM heroku/heroku:16
LABEL maintainer="01@01alchemist.com"

WORKDIR /workspace

# RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN mkdir /workspace/.nvm
ENV NVM_DIR /workspace/.nvm
ENV NODE_VERSION 10.5.0

# Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

ENV AWS_CLI_URL "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip"

RUN echo "-----> Fetching AWS CLI"

ENV VENDOR_DIR "/workspace/vendor"

RUN mkdir -p $VENDOR_DIR

RUN curl --progress-bar -o /tmp/awscli-bundle.zip $AWS_CLI_URL
RUN unzip -qq -d $VENDOR_DIR /tmp/awscli-bundle.zip

RUN echo "-----> Install awscli"
ENV INSTALL_DIR $VENDOR_DIR/awscli
RUN chmod +x $VENDOR_DIR/awscli-bundle/install
RUN $VENDOR_DIR/awscli-bundle/install -i $INSTALL_DIR
RUN chmod u+x $INSTALL_DIR/bin/aws
ENV PATH $PATH:$INSTALL_DIR/bin
RUN echo "export PATH=$PATH:$INSTALL_DIR/bin" >> /workspace/.bash_profile
RUN aws configure set region "us-east-1"
#cleaning up...
RUN rm -rf /tmp/awscli*

RUN echo "-----> aws cli installation done"

WORKDIR /app

RUN npm i -g yarn@1.7.0 typescript ts-node heroku cross-env
RUN ln -s /workspace/.nvm/versions/node/v10.5.0/bin/node /usr/local/bin/node
RUN ln -s /workspace/.nvm/versions/node/v10.5.0/bin/ts-node /usr/local/bin/ts-node

EXPOSE 80 443 22 8080 9229-9239
CMD [ "bash" ]
