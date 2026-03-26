export const handler = async (event) => {
  try {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const url = process.env.GRAPHQL_URL;

    console.log(`Invoking ${url} to fetch customer token for ${email}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation GenerateToken($email: String!, $password: String!) {
            generateCustomerToken(email: $email, password: $password) {
              token
            }
          }
        `,
        variables: { email, password }
      })
    });

    const data = await response.json();
    console.log("GraphQL response:", data);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};