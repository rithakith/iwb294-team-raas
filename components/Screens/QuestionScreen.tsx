import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type QuestionScreenProps = {};

const QuestionScreen: React.FC<QuestionScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute(); // U
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [step, setStep] = useState(1);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Retrieve stored user data and token on component mount
    const fetchStoredData = async () => {
      await retrieveUserData();
      setStep(1);
    };
    fetchStoredData();
  }, []);

  const retrieveUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      const storedToken = await AsyncStorage.getItem("authToken");

      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        console.log("User Data:", parsedUserData);
        setUserData(parsedUserData); // Set user data in state
      }

      if (storedToken) {
        setToken(storedToken); // Set token in state
      }
    } catch (error) {
      console.log("Error retrieving user data:", error);
    }
  };

  const questions = [
    {
      step: 1,
      topic: "Dietary Preference",
      question: "What is your dietary preference?",
      answers: ["Vegetarian", "Vegan", "Pescatarian", "Other"],
    },
    {
      step: 2,
      topic: "Food Allergies",
      question: "Do you have any food allergies?",
      answers: ["Gluten", "Nuts", "Dairy", "None"],
    },
    {
      step: 3,
      question: "What ingredients do you currently have in your kitchen?",
      answers: [],
    },
    {
      step: 4,
      question: "What is your primary health goal?",
      answers: ["Weight Loss", "Muscle Gain", "Maintain Weight", "Other"],
    },
  ];

  const currentQuestion = questions.find((q) => q.step === step);
  useEffect(() => {
    if (route.params?.resetToFirstStep) {
      setStep(1); // Reset to the first step
      setIngredients([]); // Optionally reset ingredients
      setSelectedAnswers([]); // Optionally reset selected answers
    }
  }, [route.params?.resetToFirstStep]);

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Log all selected answers when finishing
      const apiData = {
        user_name: userData.preferred_username,
        sub: userData.sub,
        email: userData.email,
        user_allergies: selectedAnswers[1] ? [selectedAnswers[1]] : [], // Food allergies
        dietary_preferences: {
          diet_type: selectedAnswers[0], // Dietary preference
        },
        current_ingredients: ingredients, // Current ingredients
        health_goals: {
          diet_type: selectedAnswers[2], // Health goal
          weight_goal: 60, // Replace with the user's weight goal if applicable
          calorie_limit: 2000, // Replace with the user's calorie limit if applicable
        },
        favorited_recipes: {},
      };

      try {
        console.log("userdata", userData.sub);
        const response = await fetch(`${url}/api/users`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const responseData = await response.json();
        console.log("API response:", responseData); // Handle response if needed
      } catch (error) {
        console.error("Error sending data:", error);
      }

      // Log all selected answers when finishing
      console.log("Selected answers:", selectedAnswers);
      navigation.navigate("Home");
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addIngredient = () => {
    if (inputValue.trim()) {
      setIngredients([...ingredients, inputValue]);
      setInputValue("");
    }
  };

  const handleAnswerSelect = (answer: string) => {
    // Log the selected answer
    console.log("Selected answer for step", step, ":", answer);

    // Update the selected answers state
    setSelectedAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      if (updatedAnswers[step - 1]) {
        updatedAnswers[step - 1] = answer; // Replace if already exists
      } else {
        updatedAnswers.push(answer); // Add new answer
      }
      return updatedAnswers;
    });

    // handleNext(); // Move to the next question
  };

  const renderIngredient = ({ item }: { item: string }) => (
    <Text style={styles.ingredientItem}>{item}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Stepper */}
      <View style={styles.stepper}>
        {questions.map((q, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.step,
                step === q.step ? styles.activeStep : styles.inactiveStep,
              ]}
            >
              <Text style={styles.stepText}>{q.step}</Text>
            </View>
            {/* Add line between steps except for the last step */}
            {index < questions.length - 1 && <View style={styles.line} />}
          </React.Fragment>
        ))}
      </View>

      {/* Display the current question */}
      <Text style={styles.questionText}>{currentQuestion?.question}</Text>

      {/* Handle answers for each step */}
      {step === 3 ? (
        <View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type an ingredient"
            />
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ingredientContainer}>
            {ingredients.map((item, index) => (
              <Text key={index} style={styles.ingredientItem}>
                {item}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.answerSection}>
          {currentQuestion?.answers.map((answer, index) => (
            <TouchableOpacity
              key={index}
              style={styles.answerButton}
              onPress={() => handleAnswerSelect(answer)} // Log the answer when selected
            >
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Navigation buttons */}
      <View style={styles.buttonSection}>
        {step === 1 ? (
          <TouchableOpacity
            style={[styles.button, styles.previousButton, styles.shadow]}
            onPress={() => navigation.navigate("DetailInquiry")}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.previousButton, styles.shadow]}
            onPress={handlePrevious}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            step === 4 ? styles.doneButton : styles.nextButton,
            styles.shadow,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>{step === 4 ? "Done" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 150,
  },
  stepper: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  step: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 3,
  },
  activeStep: {
    backgroundColor: "#042628",
    borderColor: "#70B9BE",
  },
  inactiveStep: {
    backgroundColor: "#70B9BE",
    borderColor: "#70B9BE",
  },
  stepText: {
    color: "white",
  },
  line: {
    flex: 1,
    height: 10,
    backgroundColor: "#70B9BE",
  },
  questionText: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
  answerSection: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  answerButton: {
    backgroundColor: "#042628",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
  },
  answerText: {
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },
  buttonSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    width: "45%",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  previousButton: {
    backgroundColor: "#70B9BE",
  },
  nextButton: {
    backgroundColor: "#70B9BE",
  },
  doneButton: {
    backgroundColor: "#70B9BE",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    width: "85%",
    borderWidth: 1,
    borderColor: "#d3d3d3",
    padding: 10,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  addButton: {
    width: "15%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#70B9BE",
    borderWidth: 1,
    borderColor: "#70B9BE",
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    padding: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  ingredientList: {
    marginTop: 10,
  },
  ingredientContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center", // Center the items
    marginTop: 10,
  },
  ingredientItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#042628",
    color: "white",
    marginVertical: 5,
    marginRight: 10,
    borderRadius: 15,
  },
});

export default QuestionScreen;
