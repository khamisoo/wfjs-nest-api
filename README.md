<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
<a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
<a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
<a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

---

## 🧩 BPMN Workflow Manager (JSON-based)

This NestJS-based module enables **creation, update, deletion, and monitoring of BPMN workflows using JSON** (without requiring diagram editors or BPMN XML directly).

### 📦 Modules Used

- `@nestjs/common` – Core decorators and services
- `@nestjs/mongoose` – MongoDB integration via Mongoose
- `mongoose` – MongoDB schema/model layer
- `bpmn-moddle` – Converts JSON structure into BPMN 2.0 XML
- `fs` and `path` – File system operations for saving workflows
- `process.cwd()` – Ensures BPMN files are saved in the project root

### 🧠 How It Works

1. Users send JSON-formatted workflow definitions via the `/workflows` POST endpoint.
2. The JSON is transformed into BPMN XML using `bpmn-moddle`.
3. The `.bpmn` file is saved inside the app root directory under `/bpmn/`.
4. Workflow metadata is stored in MongoDB: name, status, current step, timestamps.
5. A set of RESTful routes allow full CRUD operations and step tracking.

### 🔄 Supported Endpoints

| Method | Endpoint                        | Description                          |
|--------|----------------------------------|--------------------------------------|
| POST   | `/workflows`                    | Create a workflow from JSON          |
| PATCH  | `/workflows/:name`              | Update a workflow by name            |
| DELETE | `/workflows/:name`              | Delete workflow and mark as deleted  |
| GET    | `/workflows`                    | List all workflows                   |
| GET    | `/workflows/:name`              | Get full workflow data + BPMN XML    |
| GET    | `/workflows/:name/status`       | Get status and current step          |
| PATCH  | `/workflows/:name/step`         | Update current step by ID            |

### ✅ Example JSON Payload

```json
{
  "name": "invoice-process",
  "json": {
    "id": "Definitions_1",
    "targetNamespace": "http://bpmn.io/schema/bpmn",
    "rootElements": [
      {
        "$type": "bpmn:Process",
        "id": "Process_1",
        "isExecutable": true,
        "flowElements": [
          { "$type": "bpmn:StartEvent", "id": "StartEvent_1" },
          { "$type": "bpmn:Task", "id": "ApproveInvoice" },
          { "$type": "bpmn:Task", "id": "SendToFinance" },
          { "$type": "bpmn:Task", "id": "GenerateReceipt" },
          { "$type": "bpmn:EndEvent", "id": "EndEvent_1" }
        ]
      }
    ]
  }
}
````

### 📂 File Storage

* All `.bpmn` files are saved in:

  ```
  <your-project-root>/bpmn/<workflow-name>.bpmn
  ```

* Handled using:

  ```ts
  path.join(process.cwd(), 'bpmn')
  ```

---

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

* Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
* For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
* To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
* Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
* Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
* Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
* To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
* Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

* Author - [AK](https://x.com/Abdelhameed_k_)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
