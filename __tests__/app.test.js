const endpointsJson = require("../endpoints.json");
const request = require("supertest");
const app = require("../app");
const testData = require("../db/data/test-data");
const seed = require("../db/seeds/seed");
const db = require("../db/connection");

beforeEach(() => {
  return seed(testData);
});
afterAll(() => {
  return db.end();
});

describe("GET /api", () => {
  test("200: Responds with an object detailing the documentation for each endpoint", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson);
      });
  });
});

describe("GET /api/topics", () => {
  test("200: Responds with an array of all the topics which contains the correct topic data", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body: { topics } }) => {
        expect(topics).toHaveLength(3);
        topics.forEach((topic) => {
          expect(typeof topic.slug).toBe("string");
          expect(typeof topic.description).toBe("string");
        });
      });
  });
});

describe("GET /api/articles/:article_id", () => {
  test("200: Responds with a single article chosen by Id number", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article.article_id).toBe(1);
        expect(article.title).toBe("Living in the shadow of a great man");
        expect(article.topic).toBe("mitch");
        expect(article.author).toBe("butter_bridge");
        expect(article.body).toBe("I find this existence challenging");
        expect(article.created_at).toBe("2020-07-09T20:11:00.000Z");
        expect(article.votes).toBe(100);
        expect(article.article_img_url).toBe(
          "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
        );
      });
  });
  test("400: Responds with an error message when given an invalid id", () => {
    return request(app)
      .get("/api/articles/sushi-article")
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe("Bad request - article Id can only be a number");
      });
  });
  test("404: Responds with an error message when given a valid but non-existent id", () => {
    return request(app)
      .get("/api/articles/999")
      .expect(404)
      .then(({ body: { message } }) => {
        expect(message).toBe("article does not exist");
      });
  });
});

describe("GET /api/articles", () => {
  test("200: Responds with an array of all the articles which contains the correct article data", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles).toHaveLength(13);
        articles.forEach((article) => {
          expect(article).toMatchObject({
            article_id: expect.any(Number),
            title: expect.any(String),
            topic: expect.any(String),
            author: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            comment_count: expect.any(String),
            article_img_url: expect.any(String),
          });
          expect(Number(article.comment_count)).not.toBeNaN();
        });
      });
  });
  test("200: Responds with an array of all the articles default sorted by most recent first", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles).toBeSortedBy("created_at", { coerce: true });
      });
  });
});

describe("GET /api/articles/:article_id/comments", () => {
  test("200: Responds with an array of all the comments according to the article Id provided", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments).toHaveLength(11);
        comments.forEach((comment) => {
          expect(comment).toMatchObject({
            body: expect.any(String),
            votes: expect.any(Number),
            author: expect.any(String),
            created_at: expect.any(String),
          });
        });
      });
  });
  test("200: Responds with an array of all the comments default sorted by most recent first", () => {
    return request(app)
      .get("/api/articles/3/comments")
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments).toBeSortedBy("created_at", { descending: true });
      });
  });
  test("400: Responds with an error message when given an invalid format id", () => {
    return request(app)
      .get("/api/articles/invalidEndpoint/comments")
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe("Bad request - article Id can only be a number");
      });
  });
  test("404: Responds with an error message when given a valid but non-existent id for the article", () => {
    return request(app)
      .get("/api/articles/999/comments")
      .expect(404)
      .then(({ body: { message } }) => {
        expect(message).toBe("article does not exist");
      });
  });
  test("400: Responds with an error message when given an invalid id", () => {
    return request(app)
      .get("/api/articles/sushi-article/comments")
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe("Bad request - article Id can only be a number");
      });
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("201: Responds with a newly created comment object on an article", () => {
    return request(app)
      .post("/api/articles/6/comments")
      .send({
        username: "butter_bridge",
        body: "I am a test comment",
      })
      .expect(201)
      .then(({ body: { comment } }) => {
        expect(comment).toEqual({
          comment_id: expect.any(Number),
          body: "I am a test comment",
          article_id: 6,
          author: expect.any(String),
          votes: expect.any(Number),
          created_at: expect.any(String),
        });
      });
  });
  test("400: Responds with an error message if username is missing", () => {
    return request(app)
      .post("/api/articles/5/comments")
      .send({
        body: "I am a test comment",
      })
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe("missing username, unable to post comment");
      });
  });
  test("400: Responds with an error message if body is missing", () => {
    return request(app)
      .post("/api/articles/2/comments")
      .send({
        username: "lurker",
      })
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe(
          "missing content, unable to post an empty comment"
        );
      });
  });
  test("400: Responds with an error message if username and body are missing", () => {
    return request(app)
      .post("/api/articles/3/comments")
      .send({})
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe("missing fields username and content");
      });
  });
  test("404: Responds with an error message when the user given does not exist", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({
        username: "notUser",
        body: "Test comment",
      })
      .expect(404)
      .then(({ body: { message } }) => {
        expect(message).toBe("User does not exist");
      });
  });
  test("400: Responds with an error message when given an invalid id", () => {
    return request(app)
      .post("/api/articles/newspaper-article/comments")
      .expect(400)
      .send({
        username: "butter_bridge",
        body: "I am a test comment",
      })
      .then(({ body: { message } }) => {
        expect(message).toBe("Bad request - article Id can only be a number");
      });
  });
});

describe("PATCH /api/articles/:article_id", () => {
  test("200: Responds with an increased number of votes from the object received", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 10 })
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article.votes).toBe(110);
      });
  });
  test("200: Responds with a decreased number of votes from the object received", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -10 })
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article.votes).toBe(90);
      });
  });
  test("400: Responds with an error message when given an invalid id", () => {
    return request(app)
      .patch("/api/articles/ramen-article")
      .send({ inc_votes: 5 })
      .expect(400)
      .then(({ body: { message } }) => {
        expect(message).toBe("Bad request - article Id can only be a number");
      });
  });
});

describe("Route not found", () => {
  test("404: request to non-existent route", () => {
    return request(app)
      .get("/request-at-non-existent-path")
      .expect(404)
      .then(({ body: { message } }) => {
        expect(message).toBe("Route not found");
      });
  });
});