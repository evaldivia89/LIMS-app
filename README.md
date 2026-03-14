LIMS Application – Laboratory Order Management API

Overview
A cloud-deployed Laboratory Information Management System (LIMS) prototype designed to simulate real-world laboratory workflows for managing patients, orders, and diagnostic tests.

This project demonstrates end‑to‑end system design from database architecture through API development and deployment. The goal of this application is to model how laboratory systems track patient orders, associate multiple diagnostic tests to a single order, and expose that data through a RESTful API.

Project Purpose
This project was built as a hands‑on learning exercise to deepen understanding of:
- Backend API architecture
- Relational database design
- Healthcare-style workflow modeling
- Cloud deployment
- Data normalization and validation

The application simulates common workflows found in clinical laboratory environments, including patient registration, order creation, and diagnostic test management.

Features
- Patient record creation and retrieval
- Laboratory order management
- Multiple diagnostic tests per order
- REST API endpoints for querying patient and order data
- Data normalization and validation
- Unique accession number generation
- Relational database structure with foreign key relationships
- Structured JSON responses representing hierarchical data

Example Data Structure Returned by API
Patient
  └ Orders
       └ Tests

Technology Stack
Backend
- Node.js
- Express.js

Database
- PostgreSQL

Data / API
- RESTful API architecture
- SQL queries
- Data normalization

Tools
- Git
- GitHub
- npm
- Postman (API testing)

System Architecture
The system models the relationship between laboratory entities:

Patients
 ↓
Orders
 ↓
Tests

Database Relationships
Patients
Stores patient demographic information

Orders
Linked to patients and contains accession numbers and date of service

Tests
Linked to orders and represents diagnostic tests ordered

Example API Endpoints

Create Patient Order
POST /orders

Creates a patient record (if not existing) and associates diagnostic tests with an order.

Required Fields
- firstName
- lastName
- dob
- phone
- clientId
- dos
- tests[]

Retrieve Patient Orders
GET /patients

Returns structured patient data including orders and associated tests.

Installation

Clone the repository
git clone https://github.com/evaldivia89/LIMS-app.git

Navigate into the project directory
cd LIMS-app

Install dependencies
npm install

Start the server
npm start

Example Request

POST /orders

{
  "firstName": "John",
  "lastName": "Smith",
  "dob": "1990-01-01",
  "phone": "5551234567",
  "clientId": "LAB001",
  "dos": "2026-03-14",
  "tests": ["CBC", "BMP"]
}

Learning Objectives
This project demonstrates:
- Designing relational healthcare-style data models
- Building REST APIs with Node.js and Express
- Writing SQL queries for multi-table relationships
- Data validation and normalization
- Transforming flat SQL results into structured JSON
- Deploying a backend application

Future Enhancements
Potential improvements include:
- Authentication and user roles
- Frontend user interface
- HL7/FHIR integration
- Test result reporting
- Order status tracking
- Pagination and filtering
- Dockerized deployment

Author
Edgar Valdivia
GitHub: https://github.com/evaldivia89
LinkedIn: https://linkedin.com/in/edgar-valdivia

License
This project is intended for educational and portfolio purposes.

