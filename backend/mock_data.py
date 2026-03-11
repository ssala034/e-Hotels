# ============================================================================
# Mock data — moved from the frontend so the backend serves it via API.
# This mirrors the data that was in e-hotels-frontend/src/lib/mockData/.
# Later, replace usage of these lists with actual database queries.
# ============================================================================


# ── Helper to generate 5 rooms per hotel ────────────────────────────────────

def _generate_rooms(hotel_id, base_price, start_num):
    amenities_options = [
        ["TV", "AC", "WiFi", "Minibar"],
        ["TV", "AC", "WiFi", "Safe", "Coffee Maker"],
        ["TV", "AC", "WiFi", "Fridge", "Minibar", "Safe"],
        ["TV", "AC", "WiFi", "Fridge", "Minibar", "Safe", "Balcony"],
        ["TV", "AC", "WiFi", "Fridge", "Minibar", "Safe", "Balcony", "Jacuzzi"],
    ]
    views = ["City View", "Sea View", "Mountain View", "Garden View", "No View"]
    capacities = ["Single", "Double", "Triple", "Suite", "Family"]
    room_types = ["Standard Room", "Deluxe Room", "Family Room", "Executive Suite", "Presidential Suite"]
    multipliers = [1, 1.3, 1.6, 2.2, 2.8]

    rooms = []
    for i in range(5):
        rooms.append({
            "id": f"room-{start_num + i}",
            "hotelId": hotel_id,
            "roomNumber": str((i + 1) * 100),
            "roomType": room_types[i],
            "price": round(base_price * multipliers[i]),
            "amenities": amenities_options[i],
            "capacity": capacities[i],
            "viewType": views[i % len(views)],
            "isExtendable": i >= 2,
            "problems": "AC unit needs maintenance" if (i == 4 and start_num % 20 == 0) else None,
            "images": [f"/images/rooms/room-{(start_num + i) % 10}.jpg"],
        })
    return rooms


# ── Hotel Chains ─────────────────────────────────────────────────────────────

chains = [
    {
        "id": "chain-1", "name": "Marriott International", "totalHotels": 8,
        "centralOfficeAddress": {"street": "10400 Fernwood Road", "city": "Bethesda", "stateProvince": "Maryland", "zipCode": "20817", "country": "USA"},
        "contactEmails": ["info@marriott.com", "support@marriott.com"],
        "phoneNumbers": ["+1-301-380-3000", "+1-800-627-7468"],
    },
    {
        "id": "chain-2", "name": "Hilton Worldwide", "totalHotels": 8,
        "centralOfficeAddress": {"street": "7930 Jones Branch Drive", "city": "McLean", "stateProvince": "Virginia", "zipCode": "22102", "country": "USA"},
        "contactEmails": ["contact@hilton.com", "reservations@hilton.com"],
        "phoneNumbers": ["+1-703-883-1000", "+1-800-445-8667"],
    },
    {
        "id": "chain-3", "name": "Hyatt Hotels", "totalHotels": 8,
        "centralOfficeAddress": {"street": "150 North Riverside Plaza", "city": "Chicago", "stateProvince": "Illinois", "zipCode": "60606", "country": "USA"},
        "contactEmails": ["info@hyatt.com", "guestservices@hyatt.com"],
        "phoneNumbers": ["+1-312-750-1234", "+1-800-233-1234"],
    },
    {
        "id": "chain-4", "name": "InterContinental Hotels", "totalHotels": 8,
        "centralOfficeAddress": {"street": "Broadwater Park", "city": "Denham", "stateProvince": "Buckinghamshire", "zipCode": "UB9 5HR", "country": "UK"},
        "contactEmails": ["contact@ihg.com", "reservations@ihg.com"],
        "phoneNumbers": ["+44-1895-512-000", "+1-877-424-2449"],
    },
    {
        "id": "chain-5", "name": "Four Seasons Hotels", "totalHotels": 8,
        "centralOfficeAddress": {"street": "1165 Leslie Street", "city": "Toronto", "stateProvince": "Ontario", "zipCode": "M3C 2K8", "country": "Canada"},
        "contactEmails": ["info@fourseasons.com", "reservations@fourseasons.com"],
        "phoneNumbers": ["+1-416-449-1750", "+1-800-819-5053"],
    },
]


# ── Hotels (40 total — 8 per chain) ─────────────────────────────────────────

hotels = [
    # Marriott
    {"id":"hotel-1","name":"Marriott Miami Beach","chainId":"chain-1","category":5,"address":{"street":"1201 Ocean Drive","city":"Miami Beach","stateProvince":"Florida","zipCode":"33139","country":"USA"},"contactEmail":"miamibeach@marriott.com","contactPhone":"+1-305-538-4000","numberOfRooms":5,"managerId":"emp-1"},
    {"id":"hotel-2","name":"Marriott Downtown Chicago","chainId":"chain-1","category":4,"address":{"street":"540 North Michigan Avenue","city":"Chicago","stateProvince":"Illinois","zipCode":"60611","country":"USA"},"contactEmail":"chicago@marriott.com","contactPhone":"+1-312-836-0100","numberOfRooms":5,"managerId":"emp-2"},
    {"id":"hotel-3","name":"Marriott Times Square","chainId":"chain-1","category":5,"address":{"street":"1535 Broadway","city":"New York","stateProvince":"New York","zipCode":"10036","country":"USA"},"contactEmail":"timessquare@marriott.com","contactPhone":"+1-212-398-1900","numberOfRooms":5,"managerId":"emp-3"},
    {"id":"hotel-4","name":"Marriott San Francisco","chainId":"chain-1","category":4,"address":{"street":"480 Sutter Street","city":"San Francisco","stateProvince":"California","zipCode":"94108","country":"USA"},"contactEmail":"sanfrancisco@marriott.com","contactPhone":"+1-415-398-8900","numberOfRooms":5,"managerId":"emp-4"},
    {"id":"hotel-5","name":"Marriott Boston Harbor","chainId":"chain-1","category":3,"address":{"street":"200 Seaport Boulevard","city":"Boston","stateProvince":"Massachusetts","zipCode":"02210","country":"USA"},"contactEmail":"boston@marriott.com","contactPhone":"+1-617-385-4000","numberOfRooms":5,"managerId":"emp-5"},
    {"id":"hotel-6","name":"Marriott Las Vegas","chainId":"chain-1","category":4,"address":{"street":"325 Convention Center Drive","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89109","country":"USA"},"contactEmail":"lasvegas@marriott.com","contactPhone":"+1-702-650-2000","numberOfRooms":5,"managerId":"emp-6"},
    {"id":"hotel-7","name":"Marriott Seattle Waterfront","chainId":"chain-1","category":3,"address":{"street":"2100 Alaskan Way","city":"Seattle","stateProvince":"Washington","zipCode":"98121","country":"USA"},"contactEmail":"seattle@marriott.com","contactPhone":"+1-206-443-5000","numberOfRooms":5,"managerId":"emp-7"},
    {"id":"hotel-8","name":"Marriott Toronto Downtown","chainId":"chain-1","category":4,"address":{"street":"525 Bay Street","city":"Toronto","stateProvince":"Ontario","zipCode":"M5G 2L2","country":"Canada"},"contactEmail":"toronto@marriott.com","contactPhone":"+1-416-597-9200","numberOfRooms":5,"managerId":"emp-8"},
    # Hilton
    {"id":"hotel-9","name":"Hilton Miami Downtown","chainId":"chain-2","category":4,"address":{"street":"1601 Biscayne Boulevard","city":"Miami","stateProvince":"Florida","zipCode":"33132","country":"USA"},"contactEmail":"miami@hilton.com","contactPhone":"+1-305-374-0000","numberOfRooms":5,"managerId":"emp-9"},
    {"id":"hotel-10","name":"Hilton Chicago","chainId":"chain-2","category":5,"address":{"street":"720 South Michigan Avenue","city":"Chicago","stateProvince":"Illinois","zipCode":"60605","country":"USA"},"contactEmail":"chicago@hilton.com","contactPhone":"+1-312-922-4400","numberOfRooms":5,"managerId":"emp-10"},
    {"id":"hotel-11","name":"Hilton Midtown Manhattan","chainId":"chain-2","category":4,"address":{"street":"1335 Avenue of the Americas","city":"New York","stateProvince":"New York","zipCode":"10019","country":"USA"},"contactEmail":"midtown@hilton.com","contactPhone":"+1-212-586-7000","numberOfRooms":5,"managerId":"emp-11"},
    {"id":"hotel-12","name":"Hilton San Francisco Union Square","chainId":"chain-2","category":5,"address":{"street":"333 O'Farrell Street","city":"San Francisco","stateProvince":"California","zipCode":"94102","country":"USA"},"contactEmail":"unionsquare@hilton.com","contactPhone":"+1-415-771-1400","numberOfRooms":5,"managerId":"emp-12"},
    {"id":"hotel-13","name":"Hilton Boston Park Plaza","chainId":"chain-2","category":4,"address":{"street":"50 Park Plaza","city":"Boston","stateProvince":"Massachusetts","zipCode":"02116","country":"USA"},"contactEmail":"parkplaza@hilton.com","contactPhone":"+1-617-426-2000","numberOfRooms":5,"managerId":"emp-13"},
    {"id":"hotel-14","name":"Hilton Grand Vacations Las Vegas","chainId":"chain-2","category":3,"address":{"street":"2650 Las Vegas Boulevard South","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89109","country":"USA"},"contactEmail":"grandvacations@hilton.com","contactPhone":"+1-702-946-9000","numberOfRooms":5,"managerId":"emp-14"},
    {"id":"hotel-15","name":"Hilton Seattle Airport","chainId":"chain-2","category":3,"address":{"street":"17620 International Boulevard","city":"Seattle","stateProvince":"Washington","zipCode":"98188","country":"USA"},"contactEmail":"seattleairport@hilton.com","contactPhone":"+1-206-244-4800","numberOfRooms":5,"managerId":"emp-15"},
    {"id":"hotel-16","name":"Hilton Toronto","chainId":"chain-2","category":4,"address":{"street":"145 Richmond Street West","city":"Toronto","stateProvince":"Ontario","zipCode":"M5H 2L2","country":"Canada"},"contactEmail":"toronto@hilton.com","contactPhone":"+1-416-869-3456","numberOfRooms":5,"managerId":"emp-16"},
    # Hyatt
    {"id":"hotel-17","name":"Hyatt Regency Miami","chainId":"chain-3","category":4,"address":{"street":"400 SE 2nd Avenue","city":"Miami","stateProvince":"Florida","zipCode":"33131","country":"USA"},"contactEmail":"miami@hyatt.com","contactPhone":"+1-305-358-1234","numberOfRooms":5,"managerId":"emp-17"},
    {"id":"hotel-18","name":"Hyatt Regency Chicago","chainId":"chain-3","category":5,"address":{"street":"151 East Wacker Drive","city":"Chicago","stateProvince":"Illinois","zipCode":"60601","country":"USA"},"contactEmail":"chicago@hyatt.com","contactPhone":"+1-312-565-1234","numberOfRooms":5,"managerId":"emp-18"},
    {"id":"hotel-19","name":"Hyatt Grand Central New York","chainId":"chain-3","category":4,"address":{"street":"109 East 42nd Street","city":"New York","stateProvince":"New York","zipCode":"10017","country":"USA"},"contactEmail":"grandcentral@hyatt.com","contactPhone":"+1-212-883-1234","numberOfRooms":5,"managerId":"emp-19"},
    {"id":"hotel-20","name":"Hyatt Regency San Francisco","chainId":"chain-3","category":5,"address":{"street":"5 Embarcadero Center","city":"San Francisco","stateProvince":"California","zipCode":"94111","country":"USA"},"contactEmail":"sanfrancisco@hyatt.com","contactPhone":"+1-415-788-1234","numberOfRooms":5,"managerId":"emp-20"},
    {"id":"hotel-21","name":"Hyatt Regency Boston","chainId":"chain-3","category":4,"address":{"street":"1 Avenue de Lafayette","city":"Boston","stateProvince":"Massachusetts","zipCode":"02111","country":"USA"},"contactEmail":"boston@hyatt.com","contactPhone":"+1-617-912-1234","numberOfRooms":5,"managerId":"emp-21"},
    {"id":"hotel-22","name":"Hyatt Regency Lake Las Vegas","chainId":"chain-3","category":4,"address":{"street":"101 Montelago Boulevard","city":"Henderson","stateProvince":"Nevada","zipCode":"89011","country":"USA"},"contactEmail":"lakelasvegas@hyatt.com","contactPhone":"+1-702-567-1234","numberOfRooms":5,"managerId":"emp-22"},
    {"id":"hotel-23","name":"Hyatt Regency Seattle","chainId":"chain-3","category":3,"address":{"street":"808 Howell Street","city":"Seattle","stateProvince":"Washington","zipCode":"98101","country":"USA"},"contactEmail":"seattle@hyatt.com","contactPhone":"+1-206-973-1234","numberOfRooms":5,"managerId":"emp-23"},
    {"id":"hotel-24","name":"Hyatt Regency Toronto","chainId":"chain-3","category":4,"address":{"street":"370 King Street West","city":"Toronto","stateProvince":"Ontario","zipCode":"M5V 1J9","country":"Canada"},"contactEmail":"toronto@hyatt.com","contactPhone":"+1-416-343-1234","numberOfRooms":5,"managerId":"emp-24"},
    # InterContinental
    {"id":"hotel-25","name":"InterContinental Miami","chainId":"chain-4","category":5,"address":{"street":"100 Chopin Plaza","city":"Miami","stateProvince":"Florida","zipCode":"33131","country":"USA"},"contactEmail":"miami@ihg.com","contactPhone":"+1-305-577-1000","numberOfRooms":5,"managerId":"emp-25"},
    {"id":"hotel-26","name":"InterContinental Chicago","chainId":"chain-4","category":5,"address":{"street":"505 North Michigan Avenue","city":"Chicago","stateProvince":"Illinois","zipCode":"60611","country":"USA"},"contactEmail":"chicago@ihg.com","contactPhone":"+1-312-944-4100","numberOfRooms":5,"managerId":"emp-26"},
    {"id":"hotel-27","name":"InterContinental New York Times Square","chainId":"chain-4","category":5,"address":{"street":"300 West 44th Street","city":"New York","stateProvince":"New York","zipCode":"10036","country":"USA"},"contactEmail":"timessquare@ihg.com","contactPhone":"+1-212-803-4500","numberOfRooms":5,"managerId":"emp-27"},
    {"id":"hotel-28","name":"InterContinental Mark Hopkins San Francisco","chainId":"chain-4","category":5,"address":{"street":"999 California Street","city":"San Francisco","stateProvince":"California","zipCode":"94108","country":"USA"},"contactEmail":"markhopkins@ihg.com","contactPhone":"+1-415-392-3434","numberOfRooms":5,"managerId":"emp-28"},
    {"id":"hotel-29","name":"InterContinental Boston","chainId":"chain-4","category":4,"address":{"street":"510 Atlantic Avenue","city":"Boston","stateProvince":"Massachusetts","zipCode":"02210","country":"USA"},"contactEmail":"boston@ihg.com","contactPhone":"+1-617-747-1000","numberOfRooms":5,"managerId":"emp-29"},
    {"id":"hotel-30","name":"InterContinental Alliance Resorts Las Vegas","chainId":"chain-4","category":3,"address":{"street":"3500 Paradise Road","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89169","country":"USA"},"contactEmail":"alliance@ihg.com","contactPhone":"+1-702-507-7777","numberOfRooms":5,"managerId":"emp-30"},
    {"id":"hotel-31","name":"InterContinental Seattle","chainId":"chain-4","category":4,"address":{"street":"83 Marion Street","city":"Seattle","stateProvince":"Washington","zipCode":"98104","country":"USA"},"contactEmail":"seattle@ihg.com","contactPhone":"+1-206-264-1000","numberOfRooms":5,"managerId":"emp-31"},
    {"id":"hotel-32","name":"InterContinental Toronto Centre","chainId":"chain-4","category":5,"address":{"street":"225 Front Street West","city":"Toronto","stateProvince":"Ontario","zipCode":"M5V 2X3","country":"Canada"},"contactEmail":"torontocentre@ihg.com","contactPhone":"+1-416-597-1400","numberOfRooms":5,"managerId":"emp-32"},
    # Four Seasons
    {"id":"hotel-33","name":"Four Seasons Miami","chainId":"chain-5","category":5,"address":{"street":"1435 Brickell Avenue","city":"Miami","stateProvince":"Florida","zipCode":"33131","country":"USA"},"contactEmail":"miami@fourseasons.com","contactPhone":"+1-305-358-3535","numberOfRooms":5,"managerId":"emp-33"},
    {"id":"hotel-34","name":"Four Seasons Chicago","chainId":"chain-5","category":5,"address":{"street":"120 East Delaware Place","city":"Chicago","stateProvince":"Illinois","zipCode":"60611","country":"USA"},"contactEmail":"chicago@fourseasons.com","contactPhone":"+1-312-280-8800","numberOfRooms":5,"managerId":"emp-34"},
    {"id":"hotel-35","name":"Four Seasons New York Downtown","chainId":"chain-5","category":5,"address":{"street":"27 Barclay Street","city":"New York","stateProvince":"New York","zipCode":"10007","country":"USA"},"contactEmail":"downtown@fourseasons.com","contactPhone":"+1-646-880-1999","numberOfRooms":5,"managerId":"emp-35"},
    {"id":"hotel-36","name":"Four Seasons Silicon Valley","chainId":"chain-5","category":5,"address":{"street":"2050 University Avenue","city":"East Palo Alto","stateProvince":"California","zipCode":"94303","country":"USA"},"contactEmail":"siliconvalley@fourseasons.com","contactPhone":"+1-650-566-1200","numberOfRooms":5,"managerId":"emp-36"},
    {"id":"hotel-37","name":"Four Seasons One Dalton Boston","chainId":"chain-5","category":5,"address":{"street":"1 Dalton Street","city":"Boston","stateProvince":"Massachusetts","zipCode":"02199","country":"USA"},"contactEmail":"onedalton@fourseasons.com","contactPhone":"+1-617-447-3600","numberOfRooms":5,"managerId":"emp-37"},
    {"id":"hotel-38","name":"Four Seasons Las Vegas","chainId":"chain-5","category":5,"address":{"street":"3960 Las Vegas Boulevard South","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89119","country":"USA"},"contactEmail":"lasvegas@fourseasons.com","contactPhone":"+1-702-632-5000","numberOfRooms":5,"managerId":"emp-38"},
    {"id":"hotel-39","name":"Four Seasons Seattle","chainId":"chain-5","category":5,"address":{"street":"99 Union Street","city":"Seattle","stateProvince":"Washington","zipCode":"98101","country":"USA"},"contactEmail":"seattle@fourseasons.com","contactPhone":"+1-206-749-7000","numberOfRooms":5,"managerId":"emp-39"},
    {"id":"hotel-40","name":"Four Seasons Toronto","chainId":"chain-5","category":5,"address":{"street":"60 Yorkville Avenue","city":"Toronto","stateProvince":"Ontario","zipCode":"M4W 0A4","country":"Canada"},"contactEmail":"toronto@fourseasons.com","contactPhone":"+1-416-964-0411","numberOfRooms":5,"managerId":"emp-40"},
]


# ── Rooms (200 total — 5 per hotel) ─────────────────────────────────────────

rooms = [
    *_generate_rooms("hotel-1",  250,  1),
    *_generate_rooms("hotel-2",  200,  6),
    *_generate_rooms("hotel-3",  280, 11),
    *_generate_rooms("hotel-4",  220, 16),
    *_generate_rooms("hotel-5",  150, 21),
    *_generate_rooms("hotel-6",  190, 26),
    *_generate_rooms("hotel-7",  140, 31),
    *_generate_rooms("hotel-8",  180, 36),
    *_generate_rooms("hotel-9",  195, 41),
    *_generate_rooms("hotel-10", 260, 46),
    *_generate_rooms("hotel-11", 210, 51),
    *_generate_rooms("hotel-12", 270, 56),
    *_generate_rooms("hotel-13", 200, 61),
    *_generate_rooms("hotel-14", 130, 66),
    *_generate_rooms("hotel-15", 120, 71),
    *_generate_rooms("hotel-16", 185, 76),
    *_generate_rooms("hotel-17", 205, 81),
    *_generate_rooms("hotel-18", 275, 86),
    *_generate_rooms("hotel-19", 215, 91),
    *_generate_rooms("hotel-20", 285, 96),
    *_generate_rooms("hotel-21", 195,101),
    *_generate_rooms("hotel-22", 180,106),
    *_generate_rooms("hotel-23", 145,111),
    *_generate_rooms("hotel-24", 190,116),
    *_generate_rooms("hotel-25", 290,121),
    *_generate_rooms("hotel-26", 300,126),
    *_generate_rooms("hotel-27", 310,131),
    *_generate_rooms("hotel-28", 295,136),
    *_generate_rooms("hotel-29", 210,141),
    *_generate_rooms("hotel-30", 160,146),
    *_generate_rooms("hotel-31", 200,151),
    *_generate_rooms("hotel-32", 280,156),
    *_generate_rooms("hotel-33", 350,161),
    *_generate_rooms("hotel-34", 380,166),
    *_generate_rooms("hotel-35", 400,171),
    *_generate_rooms("hotel-36", 360,176),
    *_generate_rooms("hotel-37", 370,181),
    *_generate_rooms("hotel-38", 340,186),
    *_generate_rooms("hotel-39", 330,191),
    *_generate_rooms("hotel-40", 365,196),
]


# ── Employees (42 total — 40 managers + 2 staff) ────────────────────────────

employees = [
    {"id":"emp-1","firstName":"James","lastName":"Wilson","email":"james.wilson@marriott.com","address":{"street":"123 Ocean Drive","city":"Miami Beach","stateProvince":"Florida","zipCode":"33139","country":"USA"},"ssnSin":"***-**-1234","role":"Manager","hotelId":"hotel-1"},
    {"id":"emp-2","firstName":"Sarah","lastName":"Johnson","email":"sarah.johnson@marriott.com","address":{"street":"456 Michigan Ave","city":"Chicago","stateProvince":"Illinois","zipCode":"60611","country":"USA"},"ssnSin":"***-**-2345","role":"Manager","hotelId":"hotel-2"},
    {"id":"emp-3","firstName":"Michael","lastName":"Brown","email":"michael.brown@marriott.com","address":{"street":"789 Broadway","city":"New York","stateProvince":"New York","zipCode":"10036","country":"USA"},"ssnSin":"***-**-3456","role":"Manager","hotelId":"hotel-3"},
    {"id":"emp-4","firstName":"Emily","lastName":"Davis","email":"emily.davis@marriott.com","address":{"street":"321 Sutter St","city":"San Francisco","stateProvince":"California","zipCode":"94108","country":"USA"},"ssnSin":"***-**-4567","role":"Manager","hotelId":"hotel-4"},
    {"id":"emp-5","firstName":"David","lastName":"Martinez","email":"david.martinez@marriott.com","address":{"street":"654 Seaport Blvd","city":"Boston","stateProvince":"Massachusetts","zipCode":"02210","country":"USA"},"ssnSin":"***-**-5678","role":"Manager","hotelId":"hotel-5"},
    {"id":"emp-6","firstName":"Jennifer","lastName":"Garcia","email":"jennifer.garcia@marriott.com","address":{"street":"987 Convention Dr","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89109","country":"USA"},"ssnSin":"***-**-6789","role":"Manager","hotelId":"hotel-6"},
    {"id":"emp-7","firstName":"Robert","lastName":"Rodriguez","email":"robert.rodriguez@marriott.com","address":{"street":"147 Alaskan Way","city":"Seattle","stateProvince":"Washington","zipCode":"98121","country":"USA"},"ssnSin":"***-**-7890","role":"Manager","hotelId":"hotel-7"},
    {"id":"emp-8","firstName":"Lisa","lastName":"Wilson","email":"lisa.wilson@marriott.com","address":{"street":"258 Bay Street","city":"Toronto","stateProvince":"Ontario","zipCode":"M5G 2L2","country":"Canada"},"ssnSin":"***-**-8901","role":"Manager","hotelId":"hotel-8"},
    {"id":"emp-9","firstName":"Christopher","lastName":"Lee","email":"christopher.lee@hilton.com","address":{"street":"369 Biscayne Blvd","city":"Miami","stateProvince":"Florida","zipCode":"33132","country":"USA"},"ssnSin":"***-**-9012","role":"Manager","hotelId":"hotel-9"},
    {"id":"emp-10","firstName":"Amanda","lastName":"Walker","email":"amanda.walker@hilton.com","address":{"street":"741 Michigan Ave","city":"Chicago","stateProvince":"Illinois","zipCode":"60605","country":"USA"},"ssnSin":"***-**-0123","role":"Manager","hotelId":"hotel-10"},
    {"id":"emp-11","firstName":"Daniel","lastName":"Harris","email":"daniel.harris@hilton.com","address":{"street":"852 6th Ave","city":"New York","stateProvince":"New York","zipCode":"10019","country":"USA"},"ssnSin":"***-**-1235","role":"Manager","hotelId":"hotel-11"},
    {"id":"emp-12","firstName":"Michelle","lastName":"Clark","email":"michelle.clark@hilton.com","address":{"street":"963 O'Farrell St","city":"San Francisco","stateProvince":"California","zipCode":"94102","country":"USA"},"ssnSin":"***-**-2346","role":"Manager","hotelId":"hotel-12"},
    {"id":"emp-13","firstName":"Matthew","lastName":"Lewis","email":"matthew.lewis@hilton.com","address":{"street":"159 Park Plaza","city":"Boston","stateProvince":"Massachusetts","zipCode":"02116","country":"USA"},"ssnSin":"***-**-3457","role":"Manager","hotelId":"hotel-13"},
    {"id":"emp-14","firstName":"Jessica","lastName":"Robinson","email":"jessica.robinson@hilton.com","address":{"street":"753 Las Vegas Blvd","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89109","country":"USA"},"ssnSin":"***-**-4568","role":"Manager","hotelId":"hotel-14"},
    {"id":"emp-15","firstName":"Andrew","lastName":"Young","email":"andrew.young@hilton.com","address":{"street":"951 International Blvd","city":"Seattle","stateProvince":"Washington","zipCode":"98188","country":"USA"},"ssnSin":"***-**-5679","role":"Manager","hotelId":"hotel-15"},
    {"id":"emp-16","firstName":"Nicole","lastName":"King","email":"nicole.king@hilton.com","address":{"street":"357 Richmond St W","city":"Toronto","stateProvince":"Ontario","zipCode":"M5H 2L2","country":"Canada"},"ssnSin":"***-**-6780","role":"Manager","hotelId":"hotel-16"},
    {"id":"emp-17","firstName":"Joshua","lastName":"Wright","email":"joshua.wright@hyatt.com","address":{"street":"159 SE 2nd Ave","city":"Miami","stateProvince":"Florida","zipCode":"33131","country":"USA"},"ssnSin":"***-**-7891","role":"Manager","hotelId":"hotel-17"},
    {"id":"emp-18","firstName":"Stephanie","lastName":"Lopez","email":"stephanie.lopez@hyatt.com","address":{"street":"753 Wacker Dr","city":"Chicago","stateProvince":"Illinois","zipCode":"60601","country":"USA"},"ssnSin":"***-**-8902","role":"Manager","hotelId":"hotel-18"},
    {"id":"emp-19","firstName":"Kevin","lastName":"Hill","email":"kevin.hill@hyatt.com","address":{"street":"357 42nd St","city":"New York","stateProvince":"New York","zipCode":"10017","country":"USA"},"ssnSin":"***-**-9013","role":"Manager","hotelId":"hotel-19"},
    {"id":"emp-20","firstName":"Rachel","lastName":"Scott","email":"rachel.scott@hyatt.com","address":{"street":"951 Embarcadero","city":"San Francisco","stateProvince":"California","zipCode":"94111","country":"USA"},"ssnSin":"***-**-0124","role":"Manager","hotelId":"hotel-20"},
    {"id":"emp-21","firstName":"Brandon","lastName":"Green","email":"brandon.green@hyatt.com","address":{"street":"357 Lafayette Ave","city":"Boston","stateProvince":"Massachusetts","zipCode":"02111","country":"USA"},"ssnSin":"***-**-1236","role":"Manager","hotelId":"hotel-21"},
    {"id":"emp-22","firstName":"Lauren","lastName":"Adams","email":"lauren.adams@hyatt.com","address":{"street":"753 Montelago Blvd","city":"Henderson","stateProvince":"Nevada","zipCode":"89011","country":"USA"},"ssnSin":"***-**-2347","role":"Manager","hotelId":"hotel-22"},
    {"id":"emp-23","firstName":"Ryan","lastName":"Baker","email":"ryan.baker@hyatt.com","address":{"street":"159 Howell St","city":"Seattle","stateProvince":"Washington","zipCode":"98101","country":"USA"},"ssnSin":"***-**-3458","role":"Manager","hotelId":"hotel-23"},
    {"id":"emp-24","firstName":"Megan","lastName":"Nelson","email":"megan.nelson@hyatt.com","address":{"street":"753 King St W","city":"Toronto","stateProvince":"Ontario","zipCode":"M5V 1J9","country":"Canada"},"ssnSin":"***-**-4569","role":"Manager","hotelId":"hotel-24"},
    {"id":"emp-25","firstName":"Justin","lastName":"Carter","email":"justin.carter@ihg.com","address":{"street":"357 Chopin Plaza","city":"Miami","stateProvince":"Florida","zipCode":"33131","country":"USA"},"ssnSin":"***-**-5670","role":"Manager","hotelId":"hotel-25"},
    {"id":"emp-26","firstName":"Kimberly","lastName":"Mitchell","email":"kimberly.mitchell@ihg.com","address":{"street":"159 Michigan Ave","city":"Chicago","stateProvince":"Illinois","zipCode":"60611","country":"USA"},"ssnSin":"***-**-6781","role":"Manager","hotelId":"hotel-26"},
    {"id":"emp-27","firstName":"Timothy","lastName":"Perez","email":"timothy.perez@ihg.com","address":{"street":"753 44th St","city":"New York","stateProvince":"New York","zipCode":"10036","country":"USA"},"ssnSin":"***-**-7892","role":"Manager","hotelId":"hotel-27"},
    {"id":"emp-28","firstName":"Heather","lastName":"Roberts","email":"heather.roberts@ihg.com","address":{"street":"357 California St","city":"San Francisco","stateProvince":"California","zipCode":"94108","country":"USA"},"ssnSin":"***-**-8903","role":"Manager","hotelId":"hotel-28"},
    {"id":"emp-29","firstName":"Jason","lastName":"Turner","email":"jason.turner@ihg.com","address":{"street":"159 Atlantic Ave","city":"Boston","stateProvince":"Massachusetts","zipCode":"02210","country":"USA"},"ssnSin":"***-**-9014","role":"Manager","hotelId":"hotel-29"},
    {"id":"emp-30","firstName":"Samantha","lastName":"Phillips","email":"samantha.phillips@ihg.com","address":{"street":"753 Paradise Rd","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89169","country":"USA"},"ssnSin":"***-**-0125","role":"Manager","hotelId":"hotel-30"},
    {"id":"emp-31","firstName":"Nathan","lastName":"Campbell","email":"nathan.campbell@ihg.com","address":{"street":"357 Marion St","city":"Seattle","stateProvince":"Washington","zipCode":"98104","country":"USA"},"ssnSin":"***-**-1237","role":"Manager","hotelId":"hotel-31"},
    {"id":"emp-32","firstName":"Ashley","lastName":"Parker","email":"ashley.parker@ihg.com","address":{"street":"159 Front St W","city":"Toronto","stateProvince":"Ontario","zipCode":"M5V 2X3","country":"Canada"},"ssnSin":"***-**-2348","role":"Manager","hotelId":"hotel-32"},
    {"id":"emp-33","firstName":"Benjamin","lastName":"Evans","email":"benjamin.evans@fourseasons.com","address":{"street":"753 Brickell Ave","city":"Miami","stateProvince":"Florida","zipCode":"33131","country":"USA"},"ssnSin":"***-**-3459","role":"Manager","hotelId":"hotel-33"},
    {"id":"emp-34","firstName":"Christina","lastName":"Edwards","email":"christina.edwards@fourseasons.com","address":{"street":"357 Delaware Pl","city":"Chicago","stateProvince":"Illinois","zipCode":"60611","country":"USA"},"ssnSin":"***-**-4570","role":"Manager","hotelId":"hotel-34"},
    {"id":"emp-35","firstName":"Jonathan","lastName":"Collins","email":"jonathan.collins@fourseasons.com","address":{"street":"159 Barclay St","city":"New York","stateProvince":"New York","zipCode":"10007","country":"USA"},"ssnSin":"***-**-5671","role":"Manager","hotelId":"hotel-35"},
    {"id":"emp-36","firstName":"Rebecca","lastName":"Stewart","email":"rebecca.stewart@fourseasons.com","address":{"street":"753 University Ave","city":"East Palo Alto","stateProvince":"California","zipCode":"94303","country":"USA"},"ssnSin":"***-**-6782","role":"Manager","hotelId":"hotel-36"},
    {"id":"emp-37","firstName":"Tyler","lastName":"Morris","email":"tyler.morris@fourseasons.com","address":{"street":"357 Dalton St","city":"Boston","stateProvince":"Massachusetts","zipCode":"02199","country":"USA"},"ssnSin":"***-**-7893","role":"Manager","hotelId":"hotel-37"},
    {"id":"emp-38","firstName":"Victoria","lastName":"Rogers","email":"victoria.rogers@fourseasons.com","address":{"street":"159 Las Vegas Blvd S","city":"Las Vegas","stateProvince":"Nevada","zipCode":"89119","country":"USA"},"ssnSin":"***-**-8904","role":"Manager","hotelId":"hotel-38"},
    {"id":"emp-39","firstName":"Zachary","lastName":"Reed","email":"zachary.reed@fourseasons.com","address":{"street":"753 Union St","city":"Seattle","stateProvince":"Washington","zipCode":"98101","country":"USA"},"ssnSin":"***-**-9015","role":"Manager","hotelId":"hotel-39"},
    {"id":"emp-40","firstName":"Olivia","lastName":"Cook","email":"olivia.cook@fourseasons.com","address":{"street":"357 Yorkville Ave","city":"Toronto","stateProvince":"Ontario","zipCode":"M4W 0A4","country":"Canada"},"ssnSin":"***-**-0126","role":"Manager","hotelId":"hotel-40"},
    {"id":"emp-41","firstName":"Emma","lastName":"Morgan","email":"emma.morgan@marriott.com","address":{"street":"555 Ocean Drive","city":"Miami Beach","stateProvince":"Florida","zipCode":"33139","country":"USA"},"ssnSin":"***-**-1238","role":"Receptionist","hotelId":"hotel-1"},
    {"id":"emp-42","firstName":"Liam","lastName":"Bell","email":"liam.bell@hilton.com","address":{"street":"777 Biscayne Blvd","city":"Miami","stateProvince":"Florida","zipCode":"33132","country":"USA"},"ssnSin":"***-**-2349","role":"Receptionist","hotelId":"hotel-9"},
]


# ── Customers (20) ──────────────────────────────────────────────────────────

customers = [
    {"id":"cust-1","firstName":"John","lastName":"Doe","email":"john.doe@email.com","phone":"+1-555-0101","address":{"street":"123 Main St","city":"New York","stateProvince":"New York","zipCode":"10001","country":"USA"},"idType":"Driver License","idNumber":"DL123456","registrationDate":"2024-01-15"},
    {"id":"cust-2","firstName":"Jane","lastName":"Smith","email":"jane.smith@email.com","phone":"+1-555-0102","address":{"street":"456 Oak Ave","city":"Los Angeles","stateProvince":"California","zipCode":"90001","country":"USA"},"idType":"SSN","idNumber":"***-**-7890","registrationDate":"2024-02-20"},
    {"id":"cust-3","firstName":"Robert","lastName":"Johnson","email":"robert.johnson@email.com","phone":"+1-555-0103","address":{"street":"789 Pine Rd","city":"Chicago","stateProvince":"Illinois","zipCode":"60601","country":"USA"},"idType":"Passport","idNumber":"P12345678","registrationDate":"2024-03-10"},
    {"id":"cust-4","firstName":"Maria","lastName":"Garcia","email":"maria.garcia@email.com","phone":"+1-555-0104","address":{"street":"321 Elm St","city":"Houston","stateProvince":"Texas","zipCode":"77001","country":"USA"},"idType":"Driver License","idNumber":"DL789012","registrationDate":"2024-04-05"},
    {"id":"cust-5","firstName":"David","lastName":"Martinez","email":"david.martinez@email.com","phone":"+1-555-0105","address":{"street":"654 Maple Dr","city":"Phoenix","stateProvince":"Arizona","zipCode":"85001","country":"USA"},"idType":"SSN","idNumber":"***-**-3456","registrationDate":"2024-05-12"},
    {"id":"cust-6","firstName":"Sarah","lastName":"Anderson","email":"sarah.anderson@email.com","phone":"+1-555-0106","address":{"street":"987 Birch Ln","city":"Philadelphia","stateProvince":"Pennsylvania","zipCode":"19019","country":"USA"},"idType":"Driver License","idNumber":"DL345678","registrationDate":"2024-06-18"},
    {"id":"cust-7","firstName":"Michael","lastName":"Wilson","email":"michael.wilson@email.com","phone":"+1-555-0107","address":{"street":"147 Cedar St","city":"San Antonio","stateProvince":"Texas","zipCode":"78201","country":"USA"},"idType":"Passport","idNumber":"P87654321","registrationDate":"2024-07-22"},
    {"id":"cust-8","firstName":"Emily","lastName":"Taylor","email":"emily.taylor@email.com","phone":"+1-555-0108","address":{"street":"258 Spruce Ave","city":"San Diego","stateProvince":"California","zipCode":"92101","country":"USA"},"idType":"SSN","idNumber":"***-**-9012","registrationDate":"2024-08-30"},
    {"id":"cust-9","firstName":"Christopher","lastName":"Thomas","email":"christopher.thomas@email.com","phone":"+1-555-0109","address":{"street":"369 Willow Rd","city":"Dallas","stateProvince":"Texas","zipCode":"75201","country":"USA"},"idType":"Driver License","idNumber":"DL901234","registrationDate":"2024-09-15"},
    {"id":"cust-10","firstName":"Jessica","lastName":"Moore","email":"jessica.moore@email.com","phone":"+1-555-0110","address":{"street":"741 Ash Blvd","city":"San Jose","stateProvince":"California","zipCode":"95101","country":"USA"},"idType":"Passport","idNumber":"P34567890","registrationDate":"2024-10-20"},
    {"id":"cust-11","firstName":"Daniel","lastName":"Jackson","email":"daniel.jackson@email.com","phone":"+1-555-0111","address":{"street":"852 Fir Way","city":"Austin","stateProvince":"Texas","zipCode":"73301","country":"USA"},"idType":"Driver License","idNumber":"DL567890","registrationDate":"2024-11-05"},
    {"id":"cust-12","firstName":"Amanda","lastName":"White","email":"amanda.white@email.com","phone":"+1-555-0112","address":{"street":"963 Poplar Dr","city":"Jacksonville","stateProvince":"Florida","zipCode":"32099","country":"USA"},"idType":"SSN","idNumber":"***-**-5678","registrationDate":"2024-12-10"},
    {"id":"cust-13","firstName":"Matthew","lastName":"Harris","email":"matthew.harris@email.com","phone":"+1-555-0113","address":{"street":"159 Walnut St","city":"Fort Worth","stateProvince":"Texas","zipCode":"76101","country":"USA"},"idType":"Passport","idNumber":"P90123456","registrationDate":"2025-01-15"},
    {"id":"cust-14","firstName":"Ashley","lastName":"Martin","email":"ashley.martin@email.com","phone":"+1-555-0114","address":{"street":"357 Hickory Ln","city":"Columbus","stateProvince":"Ohio","zipCode":"43004","country":"USA"},"idType":"Driver License","idNumber":"DL234567","registrationDate":"2025-02-20"},
    {"id":"cust-15","firstName":"Joshua","lastName":"Thompson","email":"joshua.thompson@email.com","phone":"+1-555-0115","address":{"street":"753 Magnolia Ave","city":"Charlotte","stateProvince":"North Carolina","zipCode":"28201","country":"USA"},"idType":"SSN","idNumber":"***-**-8901","registrationDate":"2025-03-05"},
    {"id":"cust-16","firstName":"Sophia","lastName":"Lee","email":"sophia.lee@email.com","phone":"+1-416-555-0116","address":{"street":"951 Bay Street","city":"Toronto","stateProvince":"Ontario","zipCode":"M5G 2N8","country":"Canada"},"idType":"SIN","idNumber":"***-***-789","registrationDate":"2025-04-10"},
    {"id":"cust-17","firstName":"Alexander","lastName":"Walker","email":"alexander.walker@email.com","phone":"+1-555-0117","address":{"street":"357 Chestnut Rd","city":"San Francisco","stateProvince":"California","zipCode":"94102","country":"USA"},"idType":"Driver License","idNumber":"DL890123","registrationDate":"2025-05-15"},
    {"id":"cust-18","firstName":"Olivia","lastName":"Hall","email":"olivia.hall@email.com","phone":"+1-555-0118","address":{"street":"159 Sycamore St","city":"Indianapolis","stateProvince":"Indiana","zipCode":"46201","country":"USA"},"idType":"Passport","idNumber":"P56789012","registrationDate":"2025-06-20"},
    {"id":"cust-19","firstName":"Ryan","lastName":"Allen","email":"ryan.allen@email.com","phone":"+1-555-0119","address":{"street":"753 Cypress Way","city":"Seattle","stateProvince":"Washington","zipCode":"98101","country":"USA"},"idType":"Driver License","idNumber":"DL456789","registrationDate":"2025-07-25"},
    {"id":"cust-20","firstName":"Emma","lastName":"Young","email":"emma.young@email.com","phone":"+1-555-0120","address":{"street":"951 Redwood Dr","city":"Denver","stateProvince":"Colorado","zipCode":"80201","country":"USA"},"idType":"SSN","idNumber":"***-**-2345","registrationDate":"2025-08-30"},
]


# ── Bookings (10) ───────────────────────────────────────────────────────────

bookings = [
    {"id":"book-1","customerId":"cust-1","roomId":"room-1","checkInDate":"2026-03-15","checkOutDate":"2026-03-18","status":"Confirmed","bookingDate":"2026-02-10T10:30:00Z","specialRequests":"Late check-in after 10 PM","totalPrice":750},
    {"id":"book-2","customerId":"cust-2","roomId":"room-11","checkInDate":"2026-03-20","checkOutDate":"2026-03-23","status":"Confirmed","bookingDate":"2026-02-15T14:20:00Z","specialRequests":None,"totalPrice":840},
    {"id":"book-3","customerId":"cust-3","roomId":"room-21","checkInDate":"2026-03-02","checkOutDate":"2026-03-05","status":"Completed","bookingDate":"2026-01-20T09:15:00Z","specialRequests":"King size bed preference","totalPrice":600},
    {"id":"book-4","customerId":"cust-4","roomId":"room-31","checkInDate":"2026-04-01","checkOutDate":"2026-04-05","status":"Pending","bookingDate":"2026-02-25T16:45:00Z","specialRequests":"Ground floor room if possible","totalPrice":880},
    {"id":"book-5","customerId":"cust-5","roomId":"room-41","checkInDate":"2026-03-10","checkOutDate":"2026-03-12","status":"Cancelled","bookingDate":"2026-01-30T11:20:00Z","specialRequests":None,"totalPrice":400},
    {"id":"book-6","customerId":"cust-6","roomId":"room-51","checkInDate":"2026-03-25","checkOutDate":"2026-03-28","status":"Confirmed","bookingDate":"2026-02-18T13:00:00Z","specialRequests":"Need crib for infant","totalPrice":645},
    {"id":"book-7","customerId":"cust-7","roomId":"room-61","checkInDate":"2026-03-05","checkOutDate":"2026-03-07","status":"Converted","bookingDate":"2026-02-01T08:30:00Z","specialRequests":None,"totalPrice":380},
    {"id":"book-8","customerId":"cust-8","roomId":"room-71","checkInDate":"2026-04-10","checkOutDate":"2026-04-15","status":"Confirmed","bookingDate":"2026-02-28T15:45:00Z","specialRequests":"Need airport shuttle information","totalPrice":700},
    {"id":"book-9","customerId":"cust-9","roomId":"room-81","checkInDate":"2026-03-12","checkOutDate":"2026-03-14","status":"Confirmed","bookingDate":"2026-02-08T12:15:00Z","specialRequests":None,"totalPrice":360},
    {"id":"book-10","customerId":"cust-10","roomId":"room-91","checkInDate":"2026-03-18","checkOutDate":"2026-03-22","status":"Confirmed","bookingDate":"2026-02-12T10:00:00Z","specialRequests":"Celebrating anniversary","totalPrice":820},
]


# ── Rentings (5) ─────────────────────────────────────────────────────────────

rentings = [
    {"id":"rent-1","customerId":"cust-7","roomId":"room-61","checkInDate":"2026-03-05","checkOutDate":"2026-03-07","status":"Completed","employeeId":"emp-6","bookingId":"book-7","createdAt":"2026-03-05T14:00:00Z","totalAmount":380,"amountPaid":380},
    {"id":"rent-2","customerId":"cust-11","roomId":"room-101","checkInDate":"2026-03-01","checkOutDate":"2026-03-04","status":"Completed","employeeId":"emp-21","bookingId":None,"createdAt":"2026-03-01T16:30:00Z","totalAmount":585,"amountPaid":585},
    {"id":"rent-3","customerId":"cust-12","roomId":"room-111","checkInDate":"2026-02-28","checkOutDate":"2026-03-02","status":"Completed","employeeId":"emp-23","bookingId":None,"createdAt":"2026-02-28T11:00:00Z","totalAmount":290,"amountPaid":290},
    {"id":"rent-4","customerId":"cust-13","roomId":"room-121","checkInDate":"2026-03-01","checkOutDate":"2026-03-06","status":"Active","employeeId":"emp-25","bookingId":None,"createdAt":"2026-03-01T15:20:00Z","totalAmount":1450,"amountPaid":1000},
    {"id":"rent-5","customerId":"cust-14","roomId":"room-131","checkInDate":"2026-03-02","checkOutDate":"2026-03-05","status":"Active","employeeId":"emp-27","bookingId":None,"createdAt":"2026-03-02T09:45:00Z","totalAmount":930,"amountPaid":465},
]


# ── Payments (5) ─────────────────────────────────────────────────────────────

payments = [
    {"id":"pay-1","rentingId":"rent-1","amount":380,"paymentMethod":"Credit Card","paymentDate":"2026-03-07T11:00:00Z","employeeId":"emp-6","notes":"Full payment at checkout"},
    {"id":"pay-2","rentingId":"rent-2","amount":585,"paymentMethod":"Cash","paymentDate":"2026-03-04T10:30:00Z","employeeId":"emp-21","notes":"Walk-in customer, paid in full"},
    {"id":"pay-3","rentingId":"rent-3","amount":290,"paymentMethod":"Debit Card","paymentDate":"2026-03-02T12:15:00Z","employeeId":"emp-23","notes":None},
    {"id":"pay-4","rentingId":"rent-4","amount":1000,"paymentMethod":"Credit Card","paymentDate":"2026-03-01T15:30:00Z","employeeId":"emp-25","notes":"Partial payment at check-in"},
    {"id":"pay-5","rentingId":"rent-5","amount":465,"paymentMethod":"Credit Card","paymentDate":"2026-03-02T09:50:00Z","employeeId":"emp-27","notes":"50% deposit at check-in"},
]
