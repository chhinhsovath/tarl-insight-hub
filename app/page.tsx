"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { BookOpen, Users, BarChart3, School, ArrowRight, Target } from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()

  if (user) {
    // If user is logged in, redirect to dashboard
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">សូមស្វាគមន៍មកវិញ!</CardTitle>
            <CardDescription>អ្នកបានចូលប្រព័ន្ធហើយជា {user.full_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                {user.role}
              </Badge>
            </div>
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                ទៅកាន់ផ្ទាំងគ្រប់គ្រង
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">មជ្ឈមណ្ឌលព័ត៌មាន TaRL</h1>
            </div>
            <Link href="/login">
              <Button>ចូលប្រព័ន្ធ</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ការបង្រៀនក្នុងកម្រិតត្រឹមត្រូវ
            <span className="block text-blue-600">មជ្ឈមណ្ឌលព័ត៌មាន</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ពង្រឹងសមត្ថភាពអ្នកអប់រំដោយព័ត៌មានគំនិតផ្អែកលើទិន្នន័យ ដើម្បីកែលម្អលទ្ធផលការរៀនរបស់សិស្ស តាមរយៈវិធីសាស្ត្រ TaRL។ តាមដានការរីកចម្រើន គ្រប់គ្រងការសង្កេត និងធ្វើការសម្រេចចិត្តដោយផ្អែកលើព័ត៌មាន។
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="px-8">
                ចាប់ផ្តើម
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8">
              ស្វែងយល់បន្ថែម
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ការគ្រប់គ្រង TaRL ពេញលេញ</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              អ្វីគ្រប់យ៉ាងដែលអ្នកត្រូវការដើម្បីអនុវត្ត និងតាមដានកម្មវិធីការបង្រៀនក្នុងកម្រិតត្រឹមត្រូវប្រកបដោយប្រសិទ្ធភាព។
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <School className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>ការគ្រប់គ្រងសាលា</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">គ្រប់គ្រងសាលា គ្រូបង្រៀន និងទិន្នន័យសិស្សនៅក្នុងកម្មវិធី TaRL របស់អ្នក។</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>តាមដានសិស្ស</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">តាមដានការរីកចម្រើនរបស់សិស្សម្នាក់ៗ និងកម្រិតការរៀនក្នុងពេលវេលាជាក់ស្តែង។</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>ផ្ទាំងវិភាគ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">ការវិភាគ និងរបាយការណ៍ពេញលេញសម្រាប់ការសម្រេចចិត្តផ្អែកលើទិន្នន័យ។</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>ឧបករណ៍សង្កេត</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">ឧបករណ៍សង្កេតកន្លែងរៀន និងការវាយតម្លៃដែលមានរចនាសម្ព័ន្ធ។</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ការផ្លាស់ប្តូរដ៏មានសារៈសំខាន់</h2>
            <p className="text-lg text-blue-100">ផលប៉ះពាល់ពិតប្រាកដតាមរយៈការអប់រំផ្អែកលើទិន្នន័យ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">១,២៤៧</div>
              <div className="text-blue-100">សាលាចូលរួម</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">៨,៩៣៤</div>
              <div className="text-blue-100">គ្រូបង្រៀនបានបណ្តុះបណ្តាល</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">១៥៦,៧៨៩</div>
              <div className="text-blue-100">សិស្សទទួលបានអត្ថប្រយោជន៍</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">ត្រៀមខ្លួនដើម្បីបំលែងការអប់រំ?</h2>
          <p className="text-lg text-gray-600 mb-8">
            ចូលរួមជាមួយអ្នកអប់រំរាប់ពាន់នាក់ដែលកំពុងប្រើប្រាស់មជ្ឈមណ្ឌលព័ត៌មាន TaRL ដើម្បីកែលម្អលទ្ធផលការរៀនរបស់សិស្ស។
          </p>
          <Link href="/login">
            <Button size="lg" className="px-8">
              ចាប់ផ្តើមដំណើររបស់អ្នក
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-bold">មជ្ឈមណ្ឌលព័ត៌មាន TaRL</h3>
              </div>
              <p className="text-gray-400 mb-4">
                ពង្រឹងសមត្ថភាពអ្នកអប់រំដោយព័ត៌មានគំនិតផ្អែកលើទិន្នន័យ ដើម្បីកែលម្អលទ្ធផលការរៀនរបស់សិស្ស 
                តាមរយៈវិធីសាស្ត្រ TaRL។
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">មុខងារ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>ការគ្រប់គ្រងសាលា</li>
                <li>តាមដានសិស្ស</li>
                <li>ផ្ទាំងវិភាគ</li>
                <li>ឧបករណ៍សង្កេត</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">ជំនួយ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>ឯកសារណែនាំ</li>
                <li>ការបណ្តុះបណ្តាល</li>
                <li>មជ្ឈមណ្ឌលជំនួយ</li>
                <li>ទាក់ទងមកកាន់យើង</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; ២០២៤ មជ្ឈមណ្ឌលព័ត៌មាន TaRL។ រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
          </div>
        </div>
      </footer>
    </div>
  )
}