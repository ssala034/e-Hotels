# How to Insert Data into Database

Todo:




might try to remove the global unqiue identity for the hotel????, it seems like it may cause some global issues if we have errors.

Make sure that all the integrity constraints are done properly
* that is not nulls are on the correct attribute
* all PK and FK are correct
* all uniques are correct
* there is no redundant or duplication on any attribute or relation!!



Mod.

* Do we need to add a hotel chain
watch out for the aggregate stuff like counts
** Should defintely have a trigger or query to prevent double booking
Need payment functionality, need to have a good flow and when a customer will pay for it, just don't store in archive
review that searching mock
review booking -> renting -> archive queries
review payment queries
might need a condition that chain region = all its hotel regions
Might need to update how the triggers are used in the backend code
fix payments in general and on employee dashbaord
add a better search on bookings, like the dates