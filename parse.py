f = open("animals.txt", "r")
#print(f.readlines())
for i in f.readlines():
	print('"', i.strip(), '",', sep = '')
f.close()
