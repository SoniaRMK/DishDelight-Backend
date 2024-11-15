CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorite_meals (
    favorite_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    meal_id VARCHAR(50) NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255) NOT NULL,  
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_meal UNIQUE (user_id, meal_id)
);

-- ALTER TABLE favorite_meals
-- ADD CONSTRAINT unique_user_meal UNIQUE (user_id, meal_id);